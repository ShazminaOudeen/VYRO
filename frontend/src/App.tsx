import { Layout } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { AppHeader } from './components/layout/AppHeader';
import { SchedulePage } from './pages/SchedulePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { StaffPage } from './pages/StaffPage';

const { Content } = Layout;

export default function App() {
  return (
    <UserProvider>
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <AppHeader />
        <Content
          style={{
            padding: '24px 16px',
            maxWidth: 1100,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/schedule" replace />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="*" element={<Navigate to="/schedule" replace />} />
          </Routes>
        </Content>
      </Layout>
    </UserProvider>
  );
}
