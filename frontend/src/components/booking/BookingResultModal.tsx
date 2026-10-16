import { Modal, Typography, Button, Tag, Space, Flex, Alert, Divider } from 'antd';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  UserOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';

interface BookingResultModalProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export function BookingResultModal({
  open,
  booking,
  onClose,
  onViewMyBookings,
}: BookingResultModalProps) {
  if (!booking) return null;

  const isConfirmed = booking.status === 'BOOKED';
  const formattedDate = dayjs(booking.startsAt).format('dddd, MMMM D, YYYY');
  const formattedTime = `${dayjs(booking.startsAt).format('h:mm A')} – ${dayjs(booking.endsAt).format('h:mm A')}`;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnClose
      width={480}
      bodyStyle={{ padding: '28px 24px 20px 24px', textAlign: 'center' }}
    >
      {/* Header Icon */}
      <div style={{ marginBottom: 16 }}>
        {isConfirmed ? (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 208, 132, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleFilled style={{ fontSize: 38, color: '#00d084' }} />
          </div>
        ) : (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'rgba(250, 173, 20, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ClockCircleFilled style={{ fontSize: 38, color: '#faad14' }} />
          </div>
        )}
      </div>

      {/* Title & Subtitle */}
      <Typography.Title level={3} style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
        {isConfirmed ? 'Reservation Confirmed!' : "You're on the Waitlist!"}
      </Typography.Title>

      <Typography.Paragraph type="secondary" style={{ fontSize: 14, margin: '0 0 18px 0' }}>
        {isConfirmed
          ? "Your spot is secured. We can't wait to see you in class!"
          : 'This class has reached full capacity. You hold a priority spot in line.'}
      </Typography.Paragraph>

      {/* Waitlist Position Pill */}
      {!isConfirmed && (
        <div style={{ marginBottom: 16 }}>
          <Tag
            color="warning"
            style={{
              fontSize: 15,
              padding: '6px 16px',
              borderRadius: 20,
              fontWeight: 600,
            }}
          >
            Queue Position #{booking.queuePosition || 1}
          </Tag>
        </div>
      )}

      {/* Class Details Summary Card */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          borderRadius: 12,
          padding: '16px 18px',
          textAlign: 'left',
          marginBottom: 16,
        }}
      >
        <Typography.Title level={4} style={{ margin: '0 0 6px 0' }}>
          {booking.classTitle}
        </Typography.Title>

        <Flex vertical gap={6}>
          <Space size={6}>
            <UserOutlined style={{ color: '#8c8c8c' }} />
            <Typography.Text type="secondary">Coach:</Typography.Text>
            <Typography.Text strong>{booking.coach}</Typography.Text>
          </Space>

          <Space size={6}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <Typography.Text type="secondary">Date:</Typography.Text>
            <Typography.Text>{formattedDate}</Typography.Text>
          </Space>

          <Space size={6}>
            <ClockCircleFilled style={{ color: '#8c8c8c' }} />
            <Typography.Text type="secondary">Time:</Typography.Text>
            <Typography.Text>
              {formattedTime} ({booking.durationMinutes} mins)
            </Typography.Text>
          </Space>
        </Flex>
      </div>

      {/* Policy Explanations */}
      {isConfirmed ? (
        <Alert
          type="success"
          showIcon
          style={{ textAlign: 'left', marginBottom: 20, fontSize: 13 }}
          message="Check-in & Cancellation Policy"
          description="Please arrive 10 minutes early. Free cancellation is permitted up to 2 hours prior to class start."
        />
      ) : (
        <Alert
          type="info"
          showIcon
          style={{ textAlign: 'left', marginBottom: 20, fontSize: 13 }}
          message="How Waitlist Promotion Works"
          description="If an attendee cancels at least 2 hours before class, you will be automatically promoted to a confirmed seat!"
        />
      )}

      <Divider style={{ margin: '14px 0 18px 0' }} />

      {/* Action Buttons */}
      <Flex gap={12} justify="center">
        <Button onClick={onClose} style={{ minWidth: 120 }}>
          Keep Browsing
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={onViewMyBookings}
          style={{ minWidth: 150 }}
        >
          View in My Bookings
        </Button>
      </Flex>
    </Modal>
  );
}
