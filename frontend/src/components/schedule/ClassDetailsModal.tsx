import { Modal, Typography, Button, Tag, Progress, Space, Flex, Divider, Tooltip } from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getClassMedia } from '../../utils/classMedia';
import type { GymClass } from '../../types';

interface ClassDetailsModalProps {
    gymClass: GymClass | null;
    open: boolean;
    onClose: () => void;
    onBook: (gymClass: GymClass) => Promise<void>;
    isBooking: boolean;
    isStaff: boolean;
}

export function ClassDetailsModal({
    gymClass,
    open,
    onClose,
    onBook,
    isBooking,
    isStaff,
}: ClassDetailsModalProps) {
    if (!gymClass) return null;

    const media = getClassMedia(gymClass.title);
    const formattedDate = dayjs(gymClass.startsAt).format('dddd, MMMM D, YYYY');
    const formattedTime = `${dayjs(gymClass.startsAt).format('h:mm A')} – ${dayjs(gymClass.endsAt).format('h:mm A')}`;
    const percent = Math.min(100, Math.round((gymClass.bookedCount / gymClass.capacity) * 100));

    const handleBookClick = async () => {
        await onBook(gymClass);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            destroyOnClose
            width={560}
            bodyStyle={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}
        >
            {/* Top Cover Banner */}
            <div style={{ position: 'relative', height: 210, width: '100%', overflow: 'hidden' }}>
                <img
                    src={media.imageUrl}
                    alt={gymClass.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)',
                    }}
                />
                {/* Floating Badges */}
                <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <Tag color="geekblue" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12 }}>
                        {media.category}
                    </Tag>
                    <Tag color="purple" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 12 }}>
                        {media.intensity}
                    </Tag>
                </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px 24px 24px' }}>
                {/* Title & Coach */}
                <Typography.Title level={3} style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
                    {gymClass.title}
                </Typography.Title>

                <Space size={8} wrap style={{ marginBottom: 16 }}>
                    <Tag color="cyan">
                        <UserOutlined style={{ marginRight: 4 }} />
                        Instructor: {gymClass.coach}
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />}>{gymClass.durationMinutes} mins</Tag>
                </Space>

                {/* Schedule Details */}
                <div
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        padding: '12px 16px',
                        borderRadius: 10,
                        marginBottom: 16,
                    }}
                >
                    <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                        <Space>
                            <CalendarOutlined style={{ color: '#00d084' }} />
                            <Typography.Text strong>{formattedDate}</Typography.Text>
                        </Space>
                        <Space>
                            <ClockCircleOutlined style={{ color: '#1890ff' }} />
                            <Typography.Text type="secondary">{formattedTime}</Typography.Text>
                        </Space>
                    </Flex>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                    <Typography.Title level={5} style={{ margin: '0 0 4px 0' }}>
                        About This Class
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
                        {media.description}
                    </Typography.Paragraph>
                </div>

                {/* Capacity & Waitlist Progress */}
                <div style={{ marginBottom: 16 }}>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                            Studio Capacity
                        </Typography.Text>
                        <span style={{ fontSize: 12, color: gymClass.isFull ? '#ff4d4f' : '#00d084', fontWeight: 600 }}>
                            {gymClass.isFull
                                ? `Full (${gymClass.waitlistCount} waiting)`
                                : `${gymClass.seatsLeft} of ${gymClass.capacity} seats remaining`}
                        </span>
                    </Flex>
                    <Progress
                        percent={percent}
                        status={gymClass.isFull ? 'exception' : 'active'}
                        strokeColor={gymClass.isFull ? '#faad14' : '#00d084'}
                        size={['100%', 8]}
                        showInfo={false}
                    />
                </div>

                {/* Equipment & Amenities */}
                <div style={{ marginBottom: 20 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                        Amenities & Equipment:
                    </Typography.Text>
                    <Space size={6} wrap>
                        {media.equipment.map((item, idx) => (
                            <Tag key={idx} style={{ fontSize: 11, borderRadius: 12 }}>
                                {item}
                            </Tag>
                        ))}
                    </Space>
                </div>

                <Divider style={{ margin: '14px 0 16px 0' }} />

                {/* Bottom Action Footer */}
                <Flex justify="flex-end" gap={12}>
                    <Button onClick={onClose}>Close</Button>

                    {isStaff ? (
                        <Tooltip title="Staff accounts cannot book classes. Switch to a member to book.">
                            <Button disabled type="primary">
                                Staff View Only
                            </Button>
                        </Tooltip>
                    ) : (
                        <Button
                            type="primary"
                            size="large"
                            loading={isBooking}
                            onClick={handleBookClick}
                            style={{
                                minWidth: 160,
                                backgroundColor: gymClass.isFull ? '#faad14' : '#00d084',
                                borderColor: gymClass.isFull ? '#faad14' : '#00d084',
                            }}
                        >
                            {gymClass.isFull ? (
                                <span>
                                    <ClockCircleOutlined style={{ marginRight: 6 }} />
                                    Join Waitlist
                                </span>
                            ) : (
                                <span>
                                    <CheckCircleOutlined style={{ marginRight: 6 }} />
                                    Book Spot
                                </span>
                            )}
                        </Button>
                    )}
                </Flex>
            </div>
        </Modal>
    );
}
