import { Modal, Typography, Tag, Space, Alert, Steps, Button, theme } from 'antd';
import {
    ClockCircleFilled,
    UserOutlined,
    CalendarOutlined,
    TeamOutlined,
    ThunderboltOutlined,
    StopOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';

interface WaitlistInfoModalProps {
    open: boolean;
    booking: Booking | null;
    onClose: () => void;
    onLeaveWaitlist?: (booking: Booking) => void;
}

export function WaitlistInfoModal({
    open,
    booking,
    onClose,
    onLeaveWaitlist,
}: WaitlistInfoModalProps) {
    const { token } = theme.useToken();

    if (!booking) return null;

    const formattedDate = dayjs(booking.startsAt).format('dddd, MMMM D, YYYY');
    const formattedTime = `${dayjs(booking.startsAt).format('h:mm A')} - ${dayjs(booking.endsAt).format('h:mm A')}`;
    const queuePos = booking.queuePosition ?? 1;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            destroyOnClose
            width={520}
            styles={{
                body: {
                    padding: '24px 24px 20px 24px',
                },
            }}
        >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(250, 173, 20, 0.15)',
                        color: '#faad14',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 30,
                        marginBottom: 12,
                    }}
                >
                    <ClockCircleFilled />
                </div>

                <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                    Waitlist Queue Status
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
                    Live status and promotion tracking for your class reservation
                </Typography.Text>
            </div>

            {/* Position Spotlight Box */}
            <div
                style={{
                    backgroundColor: 'rgba(250, 173, 20, 0.08)',
                    border: '1px solid rgba(250, 173, 20, 0.3)',
                    borderRadius: 12,
                    padding: '16px 20px',
                    textAlign: 'center',
                    marginBottom: 20,
                }}
            >
                <Typography.Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                    Your Priority in Line
                </Typography.Text>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#faad14', margin: '4px 0' }}>
                    #{queuePos}
                </div>
                <Tag color="warning" style={{ borderRadius: 12, padding: '2px 10px' }}>
                    FIFO Priority Standing
                </Tag>
            </div>

            {/* Class Details Card */}
            <div
                style={{
                    backgroundColor: token.colorFillAlter,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                }}
            >
                <Typography.Title level={5} style={{ margin: '0 0 8px 0' }}>
                    {booking.classTitle}
                </Typography.Title>

                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        <UserOutlined style={{ marginRight: 6, color: '#00d084' }} />
                        Coach: <strong>{booking.coach}</strong>
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                        <CalendarOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
                        {formattedDate} · {formattedTime} ({booking.durationMinutes} mins)
                    </Typography.Text>
                </Space>
            </div>

            {/* Step Explanation of How FIFO Works */}
            <div style={{ marginBottom: 20 }}>
                <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                    How Waitlist FIFO Promotion Works:
                </Typography.Text>
                <Steps
                    direction="vertical"
                    size="small"
                    current={1}
                    items={[
                        {
                            title: 'Waitlist Joined (FIFO Order)',
                            description: 'You are placed in line based on when you joined. Earliest joins are promoted first.',
                            icon: <TeamOutlined style={{ color: '#faad14' }} />,
                        },
                        {
                            title: 'Automatic Promotion',
                            description:
                                'If a confirmed member cancels more than 2 hours before class, position #1 is instantly promoted to a confirmed seat.',
                            icon: <ThunderboltOutlined style={{ color: '#00d084' }} />,
                        },
                        {
                            title: '2-Hour Cutoff Lock',
                            description:
                                'No cancellations are allowed within 2 hours of class. The waitlist finalizes at that time.',
                            icon: <StopOutlined style={{ color: '#8c8c8c' }} />,
                        },
                    ]}
                />
            </div>

            <Alert
                type="info"
                showIcon
                style={{ marginBottom: 20, fontSize: 12, borderRadius: 8 }}
                message="No Action Required"
                description="If a spot opens up, the system will automatically upgrade your reservation and update your My Bookings status."
            />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                {onLeaveWaitlist && booking.canCancel && (
                    <Button
                        danger
                        onClick={() => {
                            onClose();
                            onLeaveWaitlist(booking);
                        }}
                    >
                        Leave Waitlist
                    </Button>
                )}
                <Button type="primary" onClick={onClose} style={{ minWidth: 100 }}>
                    Got It
                </Button>
            </div>
        </Modal>
    );
}
