import { Modal, Typography, Button, Space, Tag, theme } from 'antd';
import {
  InfoCircleFilled,
  ClockCircleFilled,
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { GymClass } from '../../types';

interface BookingConflictModalProps {
  open: boolean;
  error: string | null;
  gymClass: GymClass | null;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export function BookingConflictModal({
  open,
  error,
  gymClass,
  onClose,
  onViewMyBookings,
}: BookingConflictModalProps) {
  const { token } = theme.useToken();

  if (!error) return null;

  const lowerError = error.toLowerCase();
  const isDuplicate =
    lowerError.includes('already have an active booking') || lowerError.includes('waitlist entry');
  const isOverlap = lowerError.includes('overlap') || lowerError.includes('another class');
  const isStaff = lowerError.includes('staff');

  // Title and Icon styling based on conflict type
  let title = 'Booking Notice';
  let subtitle = error;
  let iconColor = token.colorPrimary;
  let iconBg = 'rgba(24, 144, 255, 0.12)';
  let primaryActionLabel = 'View in My Bookings';

  if (isDuplicate) {
    title = 'Active Reservation Found';
    subtitle =
      'You already have an active booking or waitlist position for this session. Each member is limited to 1 reservation per class.';
    iconColor = '#faad14';
    iconBg = 'rgba(250, 173, 20, 0.15)';
  } else if (isOverlap) {
    title = 'Schedule Conflict Detected';
    subtitle =
      'You have another confirmed class scheduled during this time window. Please check your schedule to avoid double booking.';
    iconColor = '#ff4d4f';
    iconBg = 'rgba(255, 77, 79, 0.12)';
    primaryActionLabel = 'Check My Schedule';
  } else if (isStaff) {
    title = 'Member Profile Required';
    subtitle =
      'Staff accounts manage rosters and schedules. To reserve classes as an attendee, switch to a Member profile in the top-right header.';
    iconColor = '#722ed1';
    iconBg = 'rgba(114, 46, 209, 0.12)';
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={480}
      styles={{
        body: {
          padding: '24px 24px 20px 24px',
        },
      }}
    >
      {/* Header Icon */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 12,
          }}
        >
          {isOverlap ? <ClockCircleFilled /> : <InfoCircleFilled />}
        </div>

        <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          {title}
        </Typography.Title>
        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 13, marginTop: 6, marginBottom: 0 }}
        >
          {subtitle}
        </Typography.Paragraph>
      </div>

      {/* Class Details Card (if available) */}
      {gymClass && (
        <div
          style={{
            backgroundColor: token.colorFillAlter,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Typography.Text strong style={{ fontSize: 15 }}>
              {gymClass.title}
            </Typography.Text>
            <Tag color="cyan">{gymClass.durationMinutes} mins</Tag>
          </div>

          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <UserOutlined style={{ marginRight: 6, color: '#00d084' }} />
              Coach: <strong>{gymClass.coach}</strong>
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <CalendarOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
              {dayjs(gymClass.startsAt).format('dddd, MMM D · h:mm A')}
            </Typography.Text>
          </Space>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button onClick={onClose} style={{ borderRadius: 8 }}>
          {isStaff ? 'Dismiss' : 'Keep Browsing'}
        </Button>
        {!isStaff && (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={() => {
              onClose();
              onViewMyBookings();
            }}
            style={{
              borderRadius: 8,
              backgroundColor: isDuplicate ? '#faad14' : undefined,
              borderColor: isDuplicate ? '#faad14' : undefined,
            }}
          >
            {primaryActionLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
}
