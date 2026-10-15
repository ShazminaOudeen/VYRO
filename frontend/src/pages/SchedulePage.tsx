import { Typography, Card } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export function SchedulePage() {
    return (
        <div>
            <Typography.Title level={2}>
                <CalendarOutlined style={{ marginRight: 10 }} />
                Class Schedule
            </Typography.Title>
            <Typography.Paragraph type="secondary">
                Browse upcoming classes for the next 7 days, check seat availability, and book your spot.
            </Typography.Paragraph>

            <Card>
                <Typography.Text type="secondary">Class schedule list will be displayed here in Task 7.</Typography.Text>
            </Card>
        </div>
    );
}
