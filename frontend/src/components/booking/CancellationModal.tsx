import { Modal, Button, Typography, Alert, Space, Tag, theme } from 'antd';
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Booking } from '../../types';

interface CancellationModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (bookingId: number) => Promise<void>;
  confirmLoading: boolean;
}

export function CancellationModal({
  booking,
  open,
  onClose,
  onConfirm,
  confirmLoading,
}: CancellationModalProps) {
  const { token } = theme.useToken();

  if (!booking) return null;

  const isWaitlisted = booking.status === 'WAITLISTED';
  const formattedDate = dayjs(booking.startsAt).format('dddd, MMMM D, YYYY');
  const formattedTime = `${dayjs(booking.startsAt).format('h:mm A')} - ${dayjs(booking.endsAt).format('h:mm A')}`;

  const handleConfirm = async () => {
    await onConfirm(booking.id);
    onClose();
  };

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
          padding: '24px 20px 16px 20px',
        },
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: isWaitlisted ? 'rgba(250, 173, 20, 0.15)' : 'rgba(255, 77, 79, 0.12)',
            color: isWaitlisted ? '#faad14' : '#ff4d4f',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            marginBottom: 12,
          }}
        >
          <ExclamationCircleOutlined />
        </div>

        <Typography.Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          {isWaitlisted ? 'Leave Class Waitlist?' : 'Cancel Class Reservation?'}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
          {isWaitlisted
            ? 'You will forfeit your current position in the waitlist queue.'
            : 'Your confirmed spot will be immediately offered to the next waitlisted member.'}
        </Typography.Text>
      </div>

      {/* Class Details Summary Box */}
      <div
        style={{
          backgroundColor: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 8,
          }}
        >
          <Typography.Text strong style={{ fontSize: 16 }}>
            {booking.classTitle}
          </Typography.Text>
          {isWaitlisted ? (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Waitlist #{booking.queuePosition ?? 1}
            </Tag>
          ) : (
            <Tag color="success">Confirmed Seat</Tag>
          )}
        </div>

        <Space direction="vertical" size={4} style={{ width: '100%' }}>
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

      {/* Policy & Rule Notice */}
      {isWaitlisted ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8, fontSize: 12 }}
          message="Waitlist FIFO Rule"
          description="If you leave now, you will lose priority. If you rejoin later, you will be placed at the back of the queue."
        />
      ) : (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8, fontSize: 12 }}
          message="2-Hour Cancellation Policy"
          description="Cancellations are permitted up to 2 hours before class. Releasing your spot gives waitlisted members a chance to participate."
        />
      )}

      {/* Modal Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          size="large"
          block
          onClick={onClose}
          disabled={confirmLoading}
          style={{ borderRadius: 8 }}
        >
          {isWaitlisted ? 'Stay on Waitlist' : 'Keep Reservation'}
        </Button>
        <Button
          size="large"
          type="primary"
          danger
          block
          loading={confirmLoading}
          onClick={handleConfirm}
          style={{ borderRadius: 8 }}
        >
          {isWaitlisted ? 'Leave Waitlist' : 'Yes, Cancel Booking'}
        </Button>
      </div>
    </Modal>
  );
}
