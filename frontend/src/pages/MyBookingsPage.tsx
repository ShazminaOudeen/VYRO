import { Typography, Card } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { useUser } from '../context/UserContext';

export function MyBookingsPage() {
    const { currentUser } = useUser();

    return (
        <div>
            <Typography.Title level={2}>
                <UnorderedListOutlined style={{ marginRight: 10 }} />
                My Bookings
            </Typography.Title>
            <Typography.Paragraph type="secondary">
                View your active reservations and waitlist positions for <strong>{currentUser?.name || 'User'}</strong>.
            </Typography.Paragraph>

            <Card>
                <Typography.Text type="secondary">Your active bookings and waitlist entries will be displayed here in Task 7.</Typography.Text>
            </Card>
        </div>
    );
}
