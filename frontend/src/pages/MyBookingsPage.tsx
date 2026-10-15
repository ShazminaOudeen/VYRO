import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Tabs, Alert, message, Space, Badge } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';
import { useUser } from '../context/useUser';
import { fetchMyBookings, cancelBooking, getApiErrorMessage } from '../api/client';
import { BookingCard } from '../components/booking/BookingCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import type { Booking } from '../types';

export function MyBookingsPage() {
    const navigate = useNavigate();
    const { currentUser } = useUser();

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL' | 'CANCELLED'>('ACTIVE');

    const loadBookings = async () => {
        if (!currentUser) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchMyBookings(currentUser.id);
            setBookings(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            return;
        }

        let ignore = false;
        fetchMyBookings(currentUser.id)
            .then((data) => {
                if (!ignore) {
                    setBookings(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(getApiErrorMessage(err));
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [currentUser]);

    const handleCancel = async (bookingId: number) => {
        if (!currentUser) return;
        setCancellingId(bookingId);
        try {
            await cancelBooking(bookingId, currentUser.id);
            message.success('Booking cancelled successfully.');
            await loadBookings();
        } catch (err) {
            message.error(getApiErrorMessage(err));
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return <LoadingState tip="Loading your bookings..." />;
    }

    if (error) {
        return <ErrorState title="Failed to Load Bookings" message={error} onRetry={loadBookings} />;
    }

    const activeList = bookings.filter((b) => b.status === 'BOOKED' || b.status === 'WAITLISTED');
    const cancelledList = bookings.filter((b) => b.status === 'CANCELLED');

    const displayedList =
        activeTab === 'ACTIVE'
            ? activeList
            : activeTab === 'CANCELLED'
                ? cancelledList
                : bookings;

    return (
        <div>
            {/* Page Header */}
            <div style={{ marginBottom: 24 }}>
                <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                    <UnorderedListOutlined style={{ marginRight: 10, color: '#00d084' }} />
                    My Bookings
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
                    Manage reservations and view waitlist positions for <strong>{currentUser?.name || 'Selected User'}</strong>.
                </Typography.Paragraph>
            </div>

            {/* Staff Notice */}
            {currentUser?.role === 'STAFF' && (
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                    message="Staff Account Notice"
                    description="You are currently signed in as Staff. Switch to a Member account in the top-right header to test personal class bookings and cancellations."
                />
            )}

            {/* Tabs & List */}
            {bookings.length === 0 ? (
                <EmptyState
                    title="No Bookings Yet"
                    description={
                        currentUser?.role === 'STAFF'
                            ? "Staff members don't have personal class bookings. Switch to a member to test booking."
                            : "You don't have any reservations yet. Browse the schedule and book your first class!"
                    }
                    actionLabel="Browse Schedule"
                    onAction={() => navigate('/schedule')}
                />
            ) : (
                <>
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as 'ACTIVE' | 'ALL' | 'CANCELLED')}
                        style={{ marginBottom: 16 }}
                        items={[
                            {
                                key: 'ACTIVE',
                                label: (
                                    <span>
                                        Active Reservations{' '}
                                        <Badge count={activeList.length} style={{ backgroundColor: '#00d084' }} />
                                    </span>
                                ),
                            },
                            {
                                key: 'ALL',
                                label: (
                                    <span>
                                        All History <Badge count={bookings.length} style={{ backgroundColor: '#1890ff' }} />
                                    </span>
                                ),
                            },
                            {
                                key: 'CANCELLED',
                                label: (
                                    <span>
                                        Cancelled <Badge count={cancelledList.length} style={{ backgroundColor: '#8c8c8c' }} />
                                    </span>
                                ),
                            },
                        ]}
                    />

                    {displayedList.length === 0 ? (
                        <EmptyState
                            title={`No ${activeTab.toLowerCase()} bookings`}
                            description={`You have no ${activeTab.toLowerCase()} reservations in this view.`}
                        />
                    ) : (
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            {displayedList.map((booking) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    onCancel={handleCancel}
                                    isCancelling={cancellingId === booking.id}
                                />
                            ))}
                        </Space>
                    )}
                </>
            )}
        </div>
    );
}
