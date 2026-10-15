import { Card, Typography, Space, Tag, Button, Tooltip, Popconfirm, theme } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';

interface BookingCardProps {
    booking: Booking;
    onCancel: (bookingId: number) => Promise<void>;
    isCancelling: boolean;
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
    const { token } = theme.useToken();

    const formattedDateTime = dayjs(booking.startsAt).format('dddd, MMM D · h:mm A');
    const isCancelled = booking.status === 'CANCELLED';

    const renderStatusTag = () => {
        switch (booking.status) {
            case 'BOOKED':
                return (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                        Confirmed Seat
                    </Tag>
                );
            case 'WAITLISTED':
                return (
                    <Tag color="warning" icon={<ClockCircleOutlined />}>
                        Waitlist #{booking.queuePosition}
                    </Tag>
                );
            case 'CANCELLED':
                return (
                    <Tag color="default" icon={<CloseCircleOutlined />}>
                        Cancelled
                    </Tag>
                );
        }
    };

    return (
        <Card
            style={{
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                opacity: isCancelled ? 0.7 : 1,
            }}
            bodyStyle={{ padding: 18 }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                }}
            >
                <div>
                    {/* Status Tag & Coach */}
                    <Space wrap style={{ marginBottom: 8 }}>
                        {renderStatusTag()}
                        <Tag color="cyan">
                            <UserOutlined style={{ marginRight: 4 }} />
                            {booking.coach}
                        </Tag>
                        <Tag icon={<ClockCircleOutlined />}>
                            {booking.durationMinutes} mins
                        </Tag>
                    </Space>

                    {/* Title */}
                    <Typography.Title level={4} style={{ margin: '4px 0' }}>
                        {booking.classTitle}
                    </Typography.Title>

                    {/* Date & Time */}
                    <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                        {formattedDateTime}
                    </Typography.Text>

                    {/* Cancel Reason Warning if disabled */}
                    {!isCancelled && !booking.canCancel && booking.cancelDisabledReason && (
                        <div style={{ marginTop: 8 }}>
                            <Typography.Text type="warning" style={{ fontSize: 12 }}>
                                <InfoCircleOutlined style={{ marginRight: 4 }} />
                                {booking.cancelDisabledReason}
                            </Typography.Text>
                        </div>
                    )}
                </div>

                {/* Cancel Action */}
                {!isCancelled && (
                    <div>
                        {booking.canCancel ? (
                            <Popconfirm
                                title="Cancel Booking"
                                description="Are you sure you want to cancel this reservation?"
                                okText="Yes, Cancel"
                                cancelText="Keep Reservation"
                                onConfirm={() => onCancel(booking.id)}
                            >
                                <Button danger loading={isCancelling}>
                                    Cancel Booking
                                </Button>
                            </Popconfirm>
                        ) : (
                            <Tooltip title={booking.cancelDisabledReason || 'Cancellation is not permitted within 2 hours of class start'}>
                                <Button disabled danger>
                                    Cancel Booking
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
