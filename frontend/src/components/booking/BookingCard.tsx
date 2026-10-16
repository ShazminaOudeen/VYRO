import { useState } from 'react';
import { Card, Typography, Space, Tag, Button, Tooltip, theme } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    InfoCircleOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';
import { getClassMedia } from '../../utils/classMedia';
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
    const media = getClassMedia(booking.classTitle);

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
                    <Tooltip title="Click to view queue position details">
                        <Tag
                            color="warning"
                            icon={<ClockCircleOutlined />}
                            onClick={() => setWaitlistModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                        >
                            Waitlist #{booking.queuePosition ?? 1} <QuestionCircleOutlined style={{ fontSize: 11 }} />
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
                            width: 72,
                            height: 72,
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
                            <Tag color="cyan">
                                <UserOutlined style={{ marginRight: 4 }} />
                                {booking.coach}
                            </Tag>
                            <Tag icon={<ClockCircleOutlined />}>
                                {booking.durationMinutes} mins
                            </Tag>
                        </Space>

                        <Typography.Title level={4} style={{ margin: '4px 0 2px 0', fontSize: 17, fontWeight: 700 }}>
                            {booking.classTitle}
                        </Typography.Title>

                        <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                            {formattedDateTime}
                        </Typography.Text>

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

                    {/* Actions */}
                    {!isCancelled && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {isWaitlisted && (
                                <Button
                                    onClick={() => setWaitlistModalOpen(true)}
                                    style={{ borderRadius: 8 }}
                                >
                                    Queue Info
                                </Button>
                            )}

                            {booking.canCancel ? (
                                <Button
                                    danger
                                    onClick={() => setCancelModalOpen(true)}
                                    style={{ borderRadius: 8 }}
                                >
                                    {isWaitlisted ? 'Leave Waitlist' : 'Cancel Booking'}
                                </Button>
                            ) : (
                                <Tooltip title={booking.cancelDisabledReason || 'Cancellation is locked within 2 hours of class start'}>
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
