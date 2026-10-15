import { Typography, Card, Alert } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useUser } from '../context/useUser';

export function StaffPage() {
    const { isStaff, currentUser } = useUser();

    if (!isStaff) {
        return (
            <Alert
                type="warning"
                showIcon
                title="Staff Only"
                description={`Access restricted. Current user (${currentUser?.name || 'Guest'}) has role ${currentUser?.role || 'NONE'}. Please switch to a Staff user in the header to view rosters and create classes.`}
            />
        );
    }

    return (
        <div>
            <Typography.Title level={2}>
                <TeamOutlined style={{ marginRight: 10 }} />
                Staff Management
            </Typography.Title>
            <Typography.Paragraph type="secondary">
                Create new classes and view member attendance rosters.
            </Typography.Paragraph>

            <Card>
                <Typography.Text type="secondary">Class creation form and roster viewer will be displayed here in Task 8.</Typography.Text>
            </Card>
        </div>
    );
}
