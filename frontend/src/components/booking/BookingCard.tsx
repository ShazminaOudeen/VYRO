import { useState } from 'react';
import { Card, Typography, Space, Tag, Button, Tooltip, Progress, Flex, theme } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
    QuestionCircleOutlined,
    CalendarOutlined,
    RiseOutlined,
    FallOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';
import { getClassMedia } from '../../utils/classMedia';
import { downloadBookingIcs } from '../../utils/calendar';
import { CancellationModal } from './CancellationModal';
import { WaitlistInfoModal } from './WaitlistInfoModal';

interface BookingCardProps {
    booking: Booking;
    onCancel: (bookingId: number) => Promise<void>;
    isCancelling: boolean;
}

export function BookingCard({ booking, onCancel, isCancelling }: BookingCardProps) {
    const { token } = theme.useToken();
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

    const formattedDateTime = dayjs(booking.startsAt).format('dddd, MMM D · h:mm A');
    const isCancelled = booking.status === 'CANCELLED';
    const isWaitlisted = booking.status === 'WAITLISTED';
    const isConfirmed = booking.status === 'BOOKED';
    const media = getClassMedia(booking.classTitle);

    // Part B: Explainable Waitlist Odds calculation
    // Position 1 or 2 with >2 hours before class (before cancellation cutoff) = Seat likely
    // Position >=3 OR <=2 hours before class = Seat unlikely
    const queuePos = booking.queuePosition ?? 1;
    const hoursUntil = dayjs(booking.startsAt).diff(dayjs(), 'minute') / 60.0;
    const isSeatLikely = queuePos <= 2 && hoursUntil > 2;

    // Calculate visual progress percentage toward promotion
    let queueProgressPercent = 30;
    if (queuePos === 1) queueProgressPercent = hoursUntil > 2 ? 85 : 55;
    else if (queuePos === 2) queueProgressPercent = hoursUntil > 2 ? 65 : 40;
    else queueProgressPercent = Math.max(15, 35 - (queuePos - 2) * 8);

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
                    <Tooltip title="Click to view queue position & promotion details">
                        <Tag
                            color="warning"
                            icon={<ClockCircleOutlined />}
                            onClick={() => setWaitlistModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            Waitlist #{queuePos}{' '}
                            <QuestionCircleOutlined style={{ fontSize: 11 }} />
                        </Tag>
                    </Tooltip>
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
        <>
            <Card
                style={{
                    borderRadius: 14,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    opacity: isCancelled ? 0.65 : 1,
                    transition: 'all 0.2s ease',
                }}
                styles={{
                    body: {
                        padding: 16,
                    },
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    {/* Cover Thumbnail */}
                    <div
                        style={{
                            width: 76,
                            height: 76,
                            borderRadius: 10,
                            overflow: 'hidden',
                            flexShrink: 0,
                            position: 'relative',
                        }}
                    >
                        <img
                            src={media.imageUrl}
                            alt={booking.classTitle}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>

                    {/* Class & Booking Information */}
                    <div style={{ flex: '1 1 240px' }}>
                        <Space size={6} wrap style={{ marginBottom: 4 }}>
                            {renderStatusTag()}
                            {isWaitlisted && (
                                <Tag
                                    color={isSeatLikely ? 'green' : 'orange'}
                                    icon={isSeatLikely ? <RiseOutlined /> : <FallOutlined />}
                                    style={{ fontWeight: 600 }}
                                >
                                    {isSeatLikely ? `Seat likely` : `Seat unlikely`}
                                </Tag>
                            )}
                            <Tag color="cyan">
                                <UserOutlined style={{ marginRight: 4 }} />
                                {booking.coach}
                            </Tag>
                            <Tag icon={<ClockCircleOutlined />}>{booking.durationMinutes} mins</Tag>
                        </Space>

                        <Typography.Title
                            level={4}
                            style={{ margin: '4px 0 2px 0', fontSize: 17, fontWeight: 700 }}
                        >
                            {booking.classTitle}
                        </Typography.Title>

                        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                            {formattedDateTime}
                        </Typography.Text>

                        {/* Part B: Queue Progress Bar for Waitlisted Members */}
                        {isWaitlisted && (
                            <div style={{ marginTop: 8, maxWidth: 380 }}>
                                <Flex justify="space-between" align="center" style={{ marginBottom: 2 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                        Queue Standing: Position #{queuePos} ({isSeatLikely ? 'High promotion probability' : 'Low promotion probability'})
                                    </Typography.Text>
                                </Flex>
                                <Progress
                                    percent={queueProgressPercent}
                                    size="small"
                                    status={isSeatLikely ? 'active' : 'normal'}
                                    strokeColor={isSeatLikely ? '#00d084' : '#faad14'}
                                    showInfo={false}
                                />
                            </div>
                        )}

                        {/* Cutoff / Cancellation Rule Warning */}
                        {!isCancelled && !booking.canCancel && booking.cancelDisabledReason && (
                            <div style={{ marginTop: 6 }}>
                                <Typography.Text type="warning" style={{ fontSize: 12 }}>
                                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                                    {booking.cancelDisabledReason}
                                </Typography.Text>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {!isCancelled && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Part C: Add to Calendar for Confirmed Bookings */}
                            {isConfirmed && (
                                <Tooltip title="Download .ics file for Google Calendar, Apple Calendar, or Outlook">
                                    <Button
                                        icon={<CalendarOutlined />}
                                        onClick={() => downloadBookingIcs(booking)}
                                        style={{ borderRadius: 8 }}
                                    >
                                        Add to Calendar
                                    </Button>
                                </Tooltip>
                            )}

                            {isWaitlisted && (
                                <Button onClick={() => setWaitlistModalOpen(true)} style={{ borderRadius: 8 }}>
                                    Queue Info
                                </Button>
                            )}

                            {booking.canCancel ? (
                                <Button danger onClick={() => setCancelModalOpen(true)} style={{ borderRadius: 8 }}>
                                    {isWaitlisted ? 'Leave Waitlist' : 'Cancel Booking'}
                                </Button>
                            ) : (
                                <Tooltip
                                    title={
                                        booking.cancelDisabledReason ||
                                        'Cancellation is locked within 2 hours of class start'
                                    }
                                >
                                    <Button disabled danger style={{ borderRadius: 8 }}>
                                        {isWaitlisted ? 'Leave Waitlist' : 'Cancel Booking'}
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Contextual Cancellation Dialog */}
            <CancellationModal
                booking={booking}
                open={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                onConfirm={onCancel}
                confirmLoading={isCancelling}
            />

            {/* FIFO Waitlist Tracker Modal */}
            <WaitlistInfoModal
                booking={booking}
                open={waitlistModalOpen}
                onClose={() => setWaitlistModalOpen(false)}
                onLeaveWaitlist={() => {
                    setWaitlistModalOpen(false);
                    setCancelModalOpen(true);
                }}
            />
        </>
    );
}
