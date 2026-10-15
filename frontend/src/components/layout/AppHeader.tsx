import { Layout, Menu, Select, Switch, Space, Typography, Tag, theme } from 'antd';
import {
    CalendarOutlined,
    UnorderedListOutlined,
    TeamOutlined,
    MoonOutlined,
    SunOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/userContext';
import { useThemeMode } from '../../theme/context';

const { Header } = Layout;

export function AppHeader() {
    const { mode, toggle } = useThemeMode();
    const { token } = theme.useToken();
    const { users, currentUser, switchUser, isLoadingUsers } = useUser();
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        {
            key: '/schedule',
            icon: <CalendarOutlined />,
            label: 'Schedule',
        },
        {
            key: '/my-bookings',
            icon: <UnorderedListOutlined />,
            label: 'My Bookings',
        },
        {
            key: '/staff',
            icon: <TeamOutlined />,
            label: (
                <span>
                    Staff <Tag color="gold" style={{ marginLeft: 4, fontSize: 10 }}>Admin</Tag>
                </span>
            ),
        },
    ];

    const currentPath = '/' + (location.pathname.split('/')[1] || 'schedule');

    return (
        <Header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                padding: '8px 16px',
                minHeight: 64,
                height: 'auto',
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorder}`,
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            {/* Brand & Nav */}
            <Space size={16} align="center" style={{ flexWrap: 'wrap' }}>
                <Space
                    size={10}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/schedule')}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            display: 'grid',
                            placeItems: 'center',
                            background: token.colorPrimary,
                            color: token.colorTextLightSolid,
                            fontWeight: 700,
                            fontSize: 18,
                        }}
                    >
                        V
                    </div>
                    <Typography.Text strong style={{ fontSize: 18, letterSpacing: 1 }}>
                        VYRO
                    </Typography.Text>
                </Space>

                <Menu
                    mode="horizontal"
                    disabledOverflow={true}
                    selectedKeys={[currentPath]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{
                        borderBottom: 'none',
                        background: 'transparent',
                        minWidth: 280,
                    }}
                />
            </Space>

            {/* User Switcher & Dark Mode Toggle */}
            <Space size={12} align="center" style={{ flexWrap: 'wrap' }}>
                <Select
                    value={currentUser?.id}
                    onChange={switchUser}
                    loading={isLoadingUsers}
                    style={{ minWidth: 200 }}
                    placeholder="Switch User"
                    suffixIcon={<UserOutlined />}
                    options={users.map((u) => ({
                        value: u.id,
                        label: (
                            <Space orientation="horizontal" size={6}>
                                <span>{u.name}</span>
                                <Tag color={u.role === 'STAFF' ? 'gold' : 'blue'} style={{ marginRight: 0 }}>
                                    {u.role}
                                </Tag>
                            </Space>
                        ),
                    }))}
                />

                <Switch
                    checked={mode === 'dark'}
                    onChange={toggle}
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    aria-label="Toggle dark mode"
                />
            </Space>
        </Header>
    );
}
