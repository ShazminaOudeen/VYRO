import { useState, useEffect } from 'react';
import { Typography, Button, Table, Tag, Progress, Alert, Flex } from 'antd';
import {
    TeamOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    UserOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '../context/useUser';
import { fetchSchedule, getApiErrorMessage } from '../api/client';
import { CreateClassModal } from '../components/staff/CreateClassModal';
import { RosterModal } from '../components/staff/RosterModal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import type { GymClass } from '../types';

export function StaffPage() {
    const { isStaff, currentUser } = useUser();

    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedClassForRoster, setSelectedClassForRoster] = useState<GymClass | null>(null);

    const refreshClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSchedule();
            setClasses(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        fetchSchedule()
            .then((data) => {
                if (!ignore) {
                    setClasses(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(getApiErrorMessage(err));
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    // Access control: only staff can manage classes and view rosters
    if (!isStaff) {
        return (
            <Alert
                type="warning"
                showIcon
                message="Staff Access Required"
                description={`Access restricted. Current user (${currentUser?.name || 'Guest'}) has role ${currentUser?.role || 'NONE'}. Please switch to a Staff user in the header user switcher to manage classes and rosters.`}
            />
        );
    }

    if (loading) {
        return <LoadingState tip="Loading staff management portal..." />;
    }

    if (error) {
        return <ErrorState title="Failed to load classes" message={error} onRetry={refreshClasses} />;
    }

    const columns = [
        {
            title: 'Class',
            key: 'class',
            render: (_: unknown, record: GymClass) => (
                <div>
                    <Typography.Text strong style={{ fontSize: 15, display: 'block' }}>
                        {record.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {record.coach}
                    </Typography.Text>
                </div>
            ),
        },
        {
            title: 'Date & Time',
            key: 'time',
            render: (_: unknown, record: GymClass) => (
                <div>
                    <div>{dayjs(record.startsAt).format('ddd, MMM D · h:mm A')}</div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {record.durationMinutes} mins
                    </Typography.Text>
                </div>
            ),
        },
        {
            title: 'Capacity & Occupancy',
            key: 'capacity',
            render: (_: unknown, record: GymClass) => {
                const percent = Math.min(100, Math.round((record.bookedCount / record.capacity) * 100));
                return (
                    <div style={{ maxWidth: 180 }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                            <span style={{ fontSize: 12 }}>
                                {record.bookedCount} / {record.capacity} booked
                            </span>
                            {record.isFull ? (
                                <Tag color="red" style={{ margin: 0, fontSize: 11 }}>
                                    Full
                                </Tag>
                            ) : (
                                <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                                    {record.seatsLeft} left
                                </Tag>
                            )}
                        </Flex>
                        <Progress
                            percent={percent}
                            size="small"
                            status={record.isFull ? 'exception' : 'active'}
                            showInfo={false}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Waitlist',
            dataIndex: 'waitlistCount',
            key: 'waitlist',
            width: 120,
            render: (count: number) =>
                count > 0 ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                        {count} waiting
                    </Tag>
                ) : (
                    <Typography.Text type="secondary">None</Typography.Text>
                ),
        },
        {
            title: 'Action',
            key: 'action',
            width: 140,
            render: (_: unknown, record: GymClass) => (
                <Button
                    type="default"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedClassForRoster(record)}
                >
                    View Roster
                </Button>
            ),
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12} style={{ marginBottom: 24 }}>
                <div>
                    <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                        <TeamOutlined style={{ marginRight: 10, color: '#00d084' }} />
                        Staff Management
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
                        Schedule classes, monitor seat occupancy, and inspect real-time member attendance rosters.
                    </Typography.Paragraph>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setCreateModalOpen(true)}
                >
                    Create Class
                </Button>
            </Flex>

            {/* Class Table or Empty State */}
            {classes.length === 0 ? (
                <EmptyState
                    title="No Classes Scheduled"
                    description="Create your first fitness class to get started."
                    actionLabel="Create Class"
                    onAction={() => setCreateModalOpen(true)}
                />
            ) : (
                <Table
                    columns={columns}
                    dataSource={classes}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 650 }}
                />
            )}

            {/* Create Class Modal */}
            <CreateClassModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={refreshClasses}
                existingClasses={classes}
            />


            {/* Roster Modal */}
            <RosterModal
                gymClass={selectedClassForRoster}
                open={!!selectedClassForRoster}
                onClose={() => setSelectedClassForRoster(null)}
            />
        </div>
    );
}
