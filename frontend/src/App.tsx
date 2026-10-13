import { Layout, Switch, Typography, Space, Card, Button, Row, Col, theme } from 'antd';
import { MoonOutlined, SunOutlined, CalendarOutlined, TeamOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useThemeMode } from './theme/ThemeContext';

const { Header, Content } = Layout;

export default function App() {
  const { mode, toggle } = useThemeMode();
  const { token } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 16px',
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorder}`,
        }}
      >
        <Space size={10}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center',
              background: token.colorPrimary, color: token.colorTextLightSolid, fontWeight: 700,
            }}
          >
            V
          </div>
          <Typography.Text strong style={{ fontSize: 18 }}>VYRO</Typography.Text>
        </Space>

        <Switch
          checked={mode === 'dark'}
          onChange={toggle}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          aria-label="Toggle dark mode"
        />
      </Header>

      <Content style={{ padding: 16, maxWidth: 1000, width: '100%', margin: '0 auto' }}>
        <Typography.Title level={2} style={{ marginTop: 8 }}>Your gym. In motion.</Typography.Title>
        <Typography.Paragraph type="secondary">
          Discover classes, reserve your spot, and keep every session running smoothly.
        </Typography.Paragraph>

        <Row gutter={[12, 12]}>
          {[
            { icon: <CalendarOutlined />, label: 'Bookings' },
            { icon: <TeamOutlined />, label: 'Members' },
            { icon: <OrderedListOutlined />, label: 'Waitlists' },
          ].map((t) => (
            <Col xs={24} sm={8} key={t.label}>
              <Card>
                <Space direction="vertical">
                  <span style={{ color: token.colorPrimary, fontSize: 20 }}>{t.icon}</span>
                  <Typography.Text strong>{t.label}</Typography.Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Button type="primary" style={{ marginTop: 16 }}>Primary button</Button>
      </Content>
    </Layout>
  );
}