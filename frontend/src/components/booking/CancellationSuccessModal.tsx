import { Modal, Typography, Button, Space, Flex, theme } from 'antd';
import {
  CheckCircleFilled,
  CalendarOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';

interface CancellationSuccessModalProps {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onBrowseClasses: () => void;
}

export function CancellationSuccessModal({
  open,
  booking,
  onClose,
  onBrowseClasses,
}: CancellationSuccessModalProps) {
  const { token } = theme.useToken();

  if (!booking) return null;

  const isWaitlist = booking.status === 'WAITLISTED';
  const formattedDate = dayjs(booking.startsAt).format('dddd, MMMM D, YYYY');
  const formattedTime = `${dayjs(booking.startsAt).format('h:mm A')} - ${dayjs(booking.endsAt).format('h:mm A')}`;

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
          padding: '28px 24px 20px 24px',
          textAlign: 'center',
        },
      }}
    >
      {/* Header Icon */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 208, 132, 0.12)',
            color: '#00d084',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          <CheckCircleFilled />
        </div>
      </div>

      {/* Title & Subtitle */}
      <Typography.Title level={4} style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
        {isWaitlist ? 'Waitlist Entry Removed' : 'Reservation Successfully Cancelled'}
      </Typography.Title>

      <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 18px 0' }}>
        {isWaitlist
          ? 'You have been removed from the waitlist queue. Your spot has been forfeited.'
          : 'Your spot has been released immediately. The next member on the waitlist has been automatically promoted.'}
      </Typography.Paragraph>

      {/* Class Details Summary Box */}
      <div
        style={{
          backgroundColor: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 12,
          padding: 16,
          textAlign: 'left',
          marginBottom: 20,
        }}
      >
        <Typography.Text strong style={{ fontSize: 15, display: 'block', marginBottom: 6 }}>
          {booking.classTitle}
        </Typography.Text>

        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <UserOutlined style={{ marginRight: 6, color: '#00d084' }} />
            Coach: <strong>{booking.coach}</strong>
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ marginRight: 6, color: token.colorPrimary }} />
            {formattedDate} · {formattedTime} ({booking.durationMinutes} mins)
          </Typography.Text>
        </Space>
      </div>

      {/* Action Buttons */}
      <Flex gap={12} justify="center">
        <Button onClick={onClose} style={{ minWidth: 110, borderRadius: 8 }}>
          Done
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={onBrowseClasses}
          style={{ minWidth: 160, borderRadius: 8 }}
        >
          Browse Other Classes
        </Button>
      </Flex>
    </Modal>
  );
}
