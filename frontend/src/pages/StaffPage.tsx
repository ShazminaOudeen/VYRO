import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Button, Table, Tag, Progress, Alert, Flex, Space, Popconfirm, message } from 'antd';
import {
    TeamOutlined,
    PlusOutlined,
    ClockCircleOutlined,
    UserOutlined,
    EyeOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '../context/useUser';
import { fetchSchedule, resetDemoData, getApiErrorMessage } from '../api/client';
import { CreateClassModal } from '../components/staff/CreateClassModal';
import { ClassCreatedModal } from '../components/staff/ClassCreatedModal';
import { RosterModal } from '../components/staff/RosterModal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import type { GymClass } from '../types';

export function StaffPage() {
    const { isStaff, currentUser } = useUser();
    const navigate = useNavigate();

    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedClassForRoster, setSelectedClassForRoster] = useState<GymClass | null>(null);
    const [createdClassSuccess, setCreatedClassSuccess] = useState<GymClass | null>(null);

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

    const handleResetDemoData = async () => {
        setResetting(true);
        try {
            const res = await resetDemoData();
            message.success(res.message);
            await refreshClasses();
        } catch (err) {
            message.error(getApiErrorMessage(err));
        } finally {
            setResetting(false);
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
                const percent = Math.min(
                    100,
                    Math.round((record.bookedCount / record.capacity) * 100)
                );
                return (
                    <div style={{ maxWidth: 180 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                            <span>
                                <strong>{record.bookedCount}</strong> / {record.capacity} booked
                            </span>
                            <span style={{ color: record.isFull ? '#ff4d4f' : '#00d084', fontWeight: 600 }}>
                                {record.isFull ? 'Full' : `${record.seatsLeft} left`}
                            </span>
                        </div>
                        <Progress
                            percent={percent}
                            size="small"
                            showInfo={false}
                            strokeColor={record.isFull ? '#faad14' : '#00d084'}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Waitlist',
            key: 'waitlist',
            render: (_: unknown, record: GymClass) =>
                record.waitlistCount > 0 ? (
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                        {record.waitlistCount} waiting
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
                <Space>
                    <Popconfirm
                        title="Reset Demo Schedule & Bookings"
                        description="This will clear test data and re-seed 8 fresh classes across the next 7 days relative to right now. Continue?"
                        okText="Yes, Reset"
                        cancelText="Cancel"
                        onConfirm={handleResetDemoData}
                    >
                        <Button icon={<ReloadOutlined />} loading={resetting} size="large">
                            Reset Demo Data
                        </Button>
                    </Popconfirm>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => setCreateModalOpen(true)}
                    >
                        Create Class
                    </Button>
                </Space>
            </Flex>

            {/* Class Table or Empty State */}
            {classes.length === 0 ? (
                <EmptyState
                    title="No Classes Scheduled"
                    description="Create your first fitness class or reset demo data to get started."
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
                onSuccess={(created) => {
                    refreshClasses();
                    if (created) {
                        setCreatedClassSuccess(created);
                    }
                }}
                existingClasses={classes}
            />

            {/* Class Created Success Modal */}
            <ClassCreatedModal
                open={!!createdClassSuccess}
                gymClass={createdClassSuccess}
                onClose={() => setCreatedClassSuccess(null)}
                onViewSchedule={() => {
                    setCreatedClassSuccess(null);
                    navigate('/schedule');
                }}
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
