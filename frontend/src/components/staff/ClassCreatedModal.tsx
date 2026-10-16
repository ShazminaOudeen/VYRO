import { Modal, Typography, Button, Space, Tag, Flex, theme } from 'antd';
import {
  CheckCircleFilled,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { getClassMedia } from '../../utils/classMedia';
import type { GymClass } from '../../types';

interface ClassCreatedModalProps {
  open: boolean;
  gymClass: GymClass | null;
  onClose: () => void;
  onViewSchedule: () => void;
}

export function ClassCreatedModal({
  open,
  gymClass,
  onClose,
  onViewSchedule,
}: ClassCreatedModalProps) {
  const { token } = theme.useToken();

  if (!gymClass) return null;

  const media = getClassMedia(gymClass.title);
  const formattedDate = dayjs(gymClass.startsAt).format('dddd, MMMM D, YYYY');
  const formattedTime = `${dayjs(gymClass.startsAt).format('h:mm A')} - ${dayjs(gymClass.endsAt).format('h:mm A')}`;

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
        Class Published Successfully!
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: '0 0 18px 0' }}>
        Your new fitness session is now live on the 7-day schedule and open for member reservations.
      </Typography.Paragraph>

      {/* Class Details Card */}
      <div
        style={{
          backgroundColor: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 12,
          padding: 16,
          textAlign: 'left',
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <img
            src={media.imageUrl}
            alt={gymClass.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Typography.Text
              strong
              style={{
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {gymClass.title}
            </Typography.Text>
            <Tag color="cyan">{gymClass.durationMinutes}m</Tag>
          </div>

          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <UserOutlined style={{ marginRight: 5, color: '#00d084' }} />
              Coach: <strong>{gymClass.coach}</strong>
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <CalendarOutlined style={{ marginRight: 5, color: token.colorPrimary }} />
              {formattedDate} · {formattedTime}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              <TeamOutlined style={{ marginRight: 5 }} />
              Capacity: <strong>{gymClass.capacity} seats</strong>
            </Typography.Text>
          </Space>
        </div>
      </div>

      {/* Actions */}
      <Flex gap={12} justify="center">
        <Button onClick={onClose} style={{ minWidth: 100, borderRadius: 8 }}>
          Done
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={onViewSchedule}
          style={{ minWidth: 160, borderRadius: 8 }}
        >
          View on Schedule
        </Button>
      </Flex>
    </Modal>
  );
}
