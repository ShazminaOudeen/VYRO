import { Card, Typography, Space, Tag, Button, Tooltip, theme } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { GymClass } from '../../types';

interface ClassCardProps {
    gymClass: GymClass;
    onBook: (gymClass: GymClass) => Promise<void>;
    isBooking: boolean;
    isStaff: boolean;
}

export function ClassCard({ gymClass, onBook, isBooking, isStaff }: ClassCardProps) {
    const { token } = theme.useToken();

    const formattedStart = dayjs(gymClass.startsAt).format('h:mm A');
    const formattedEnd = dayjs(gymClass.endsAt).format('h:mm A');

    const buttonLabel = gymClass.isFull ? 'Join Waitlist' : 'Book Spot';

    return (
        <Card
            hoverable
            style={{
                borderRadius: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
            bodyStyle={{ padding: 18, width: '100%' }}
        >
            <div>
                {/* Top Badges */}
                <Space orientation="horizontal" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Tag color="cyan">
                        <UserOutlined style={{ marginRight: 4 }} />
                        {gymClass.coach}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />}>
                        {gymClass.durationMinutes} mins
                    </Tag>
                </Space>

                {/* Title */}
                <Typography.Title level={4} style={{ margin: '4px 0 8px 0' }}>
                    {gymClass.title}
                </Typography.Title>

                {/* Time Interval */}
                <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 14 }}>
                    {formattedStart} – {formattedEnd}
                </Typography.Text>

                {/* Capacity & Waitlist Status */}
                <Space size={6} wrap style={{ marginBottom: 16 }}>
                    {gymClass.isFull ? (
                        <>
                            <Tag color="error" icon={<ExclamationCircleOutlined />}>
                                Class Full
                            </Tag>
                            <Tag color="warning">
                                {gymClass.waitlistCount} on waitlist
                            </Tag>
                        </>
                    ) : (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                            {gymClass.seatsLeft} of {gymClass.capacity} seats left
                        </Tag>
                    )}
                </Space>
            </div>

            {/* Book / Waitlist Action */}
            <div style={{ marginTop: 8 }}>
                {isStaff ? (
                    <Tooltip title="Staff users cannot book classes. Switch to a Member in the header to book.">
                        <Button block disabled>
                            Staff View Only
                        </Button>
                    </Tooltip>
                ) : (
                    <Button
                        type={gymClass.isFull ? 'default' : 'primary'}
                        danger={false}
                        block
                        loading={isBooking}
                        onClick={() => onBook(gymClass)}
                        style={
                            gymClass.isFull
                                ? { borderColor: token.colorWarning, color: token.colorWarningText }
                                : undefined
                        }
                    >
                        {buttonLabel}
                    </Button>
                )}
            </div>
        </Card>
    );
}
