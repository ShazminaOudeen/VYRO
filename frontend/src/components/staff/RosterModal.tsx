import { useState, useEffect } from 'react';
import { Modal, Tabs, Table, Tag, Typography, Space, Badge, Button, Flex } from 'antd';
import {
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchClassRoster, getApiErrorMessage } from '../../api/client';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import type { GymClass, Booking } from '../../types';

interface RosterModalProps {
    gymClass: GymClass | null;
    open: boolean;
    onClose: () => void;
}

export function RosterModal({ gymClass, open, onClose }: RosterModalProps) {
    const [roster, setRoster] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshRoster = async () => {
        if (!gymClass) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchClassRoster(gymClass.id);
            setRoster(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open || !gymClass) {
            return;
        }

        let ignore = false;
        fetchClassRoster(gymClass.id)
            .then((data) => {
                if (!ignore) {
                    setRoster(data);
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
    }, [open, gymClass]);

    const seatedMembers = roster.filter((b) => b.status === 'BOOKED');
    const waitlistedMembers = roster
        .filter((b) => b.status === 'WAITLISTED')
        .sort((a, b) => (a.queuePosition ?? 0) - (b.queuePosition ?? 0));

    const seatedColumns = [
        {
            title: 'Seat #',
            key: 'seat',
            width: 80,
            render: (_: unknown, __: Booking, index: number) => (
                <Tag color="cyan">#{index + 1}</Tag>
            ),
        },
        {
            title: 'Member',
            dataIndex: 'memberName',
            key: 'memberName',
            render: (name: string) => (
                <Space>
                    <UserOutlined />
                    <Typography.Text strong>{name}</Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 150,
            render: () => (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                    Confirmed Seat
                </Tag>
            ),
        },
        {
            title: 'Booked On',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 170,
            render: (val: string) => dayjs(val).format('MMM D, h:mm A'),
        },
    ];

    const waitlistColumns = [
        {
            title: 'Queue Position',
            dataIndex: 'queuePosition',
            key: 'queuePosition',
            width: 130,
            render: (pos: number) => (
                <Tag color="warning" icon={<ClockCircleOutlined />}>
                    Position #{pos}
                </Tag>
            ),
        },
        {
            title: 'Member',
            dataIndex: 'memberName',
            key: 'memberName',
            render: (name: string) => (
                <Space>
                    <UserOutlined />
                    <Typography.Text strong>{name}</Typography.Text>
                </Space>
            ),
        },
        {
            title: 'Joined Waitlist',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 170,
            render: (val: string) => dayjs(val).format('MMM D, h:mm A'),
        },
    ];

    return (
        <Modal
            title={
                <Space align="center">
                    <TeamOutlined style={{ color: '#00d084' }} />
                    <span>Class Attendance Roster</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    Done
                </Button>,
            ]}
            width={720}
            destroyOnClose
        >
            {gymClass && (
                <div style={{ marginTop: 8 }}>
                    {/* Class Header Information */}
                    <div style={{ marginBottom: 16, padding: '12px 16px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 8 }}>
                        <Typography.Title level={4} style={{ margin: '0 0 4px 0' }}>
                            {gymClass.title}
                        </Typography.Title>
                        <Flex wrap="wrap" gap={8} align="center">
                            <Tag color="blue">Coach: {gymClass.coach}</Tag>
                            <Tag icon={<ClockCircleOutlined />}>
                                {dayjs(gymClass.startsAt).format('dddd, MMM D · h:mm A')} ({gymClass.durationMinutes} mins)
                            </Tag>
                            <Tag color={gymClass.isFull ? 'red' : 'green'}>
                                Seats: {gymClass.bookedCount} / {gymClass.capacity}
                            </Tag>
                            {gymClass.waitlistCount > 0 && (
                                <Tag color="warning">Waitlist: {gymClass.waitlistCount}</Tag>
                            )}
                        </Flex>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <LoadingState tip="Loading roster..." minHeight={180} />
                    ) : error ? (
                        <ErrorState title="Failed to load roster" message={error} onRetry={refreshRoster} />
                    ) : (
                        <Tabs
                            defaultActiveKey="seated"
                            items={[
                                {
                                    key: 'seated',
                                    label: (
                                        <span>
                                            Confirmed Seats{' '}
                                            <Badge count={seatedMembers.length} style={{ backgroundColor: '#00d084' }} />
                                        </span>
                                    ),
                                    children:
                                        seatedMembers.length === 0 ? (
                                            <EmptyState
                                                title="No Seats Booked"
                                                description="No members have booked a seat for this class yet."
                                                minHeight={160}
                                            />
                                        ) : (
                                            <Table
                                                dataSource={seatedMembers}
                                                columns={seatedColumns}
                                                rowKey="id"
                                                pagination={false}
                                                size="small"
                                            />
                                        ),
                                },
                                {
                                    key: 'waitlist',
                                    label: (
                                        <span>
                                            Waitlist Queue (FIFO){' '}
                                            <Badge count={waitlistedMembers.length} style={{ backgroundColor: '#faad14' }} />
                                        </span>
                                    ),
                                    children:
                                        waitlistedMembers.length === 0 ? (
                                            <EmptyState
                                                title="Waitlist is Empty"
                                                description="There are currently no members waiting in queue for this class."
                                                minHeight={160}
                                            />
                                        ) : (
                                            <Table
                                                dataSource={waitlistedMembers}
                                                columns={waitlistColumns}
                                                rowKey="id"
                                                pagination={false}
                                                size="small"
                                            />
                                        ),
                                },
                            ]}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
}
