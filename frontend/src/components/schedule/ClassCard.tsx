import { Card, Typography, Space, Tag, Button, Tooltip, theme, Flex } from 'antd';
import {
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getClassMedia } from '../../utils/classMedia';
import type { GymClass } from '../../types';

interface ClassCardProps {
  gymClass: GymClass;
  onBook: (gymClass: GymClass) => Promise<void>;
  onViewDetails: (gymClass: GymClass) => void;
  isBooking: boolean;
  isStaff: boolean;
}

export function ClassCard({ gymClass, onBook, onViewDetails, isBooking, isStaff }: ClassCardProps) {
  const { token } = theme.useToken();
  const media = getClassMedia(gymClass.title);

  const formattedStart = dayjs(gymClass.startsAt).format('h:mm A');
  const formattedEnd = dayjs(gymClass.endsAt).format('h:mm A');
  const buttonLabel = gymClass.isFull ? 'Join Waitlist' : 'Book Spot';

  return (
    <Card
      hoverable
      onClick={() => onViewDetails(gymClass)}
      cover={
        <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
          <img
            alt={gymClass.title}
            src={media.imageUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              display: 'flex',
              gap: 6,
            }}
          >
            <Tag color="geekblue" style={{ margin: 0, fontWeight: 600 }}>
              {media.category}
            </Tag>
            <Tag color="purple" style={{ margin: 0 }}>
              {media.intensity}
            </Tag>
          </div>
        </div>
      }
      style={{
        borderRadius: 14,
        border: `1px solid ${token.colorBorderSecondary}`,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      bodyStyle={{ padding: 16, width: '100%' }}
    >
      <div>
        {/* Coach & Duration */}
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 6 }}>
          <Tag color="cyan">
            <UserOutlined style={{ marginRight: 4 }} />
            {gymClass.coach}
          </Tag>
          <Tag icon={<ClockCircleOutlined />}>{gymClass.durationMinutes} mins</Tag>
        </Space>

        {/* Title */}
        <Typography.Title level={4} style={{ margin: '4px 0 6px 0', fontSize: 16 }}>
          {gymClass.title}
        </Typography.Title>

        {/* Time Interval */}
        <Typography.Text
          type="secondary"
          style={{ display: 'block', fontSize: 13, marginBottom: 12 }}
        >
          {formattedStart} – {formattedEnd}
        </Typography.Text>

        {/* Capacity & Waitlist Status */}
        <Space size={6} wrap style={{ marginBottom: 14 }}>
          {gymClass.isFull ? (
            <>
              <Tag color="error" icon={<ExclamationCircleOutlined />}>
                Full
              </Tag>
              <Tag color="warning">{gymClass.waitlistCount} on waitlist</Tag>
            </>
          ) : (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {gymClass.seatsLeft} of {gymClass.capacity} seats left
            </Tag>
          )}
        </Space>
      </div>

      {/* Actions */}
      <Flex gap={8} style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
        <Button
          icon={<InfoCircleOutlined />}
          onClick={() => onViewDetails(gymClass)}
          style={{ flex: 1 }}
        >
          Details
        </Button>

        {isStaff ? (
          <Tooltip title="Staff users cannot book classes. Switch to a Member in the header to book.">
            <Button disabled style={{ flex: 2 }}>
              Staff Only
            </Button>
          </Tooltip>
        ) : (
          <Button
            type={gymClass.isFull ? 'default' : 'primary'}
            loading={isBooking}
            onClick={() => onBook(gymClass)}
            style={{
              flex: 2,
              ...(gymClass.isFull
                ? { borderColor: token.colorWarning, color: token.colorWarningText }
                : {}),
            }}
          >
            {buttonLabel}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
