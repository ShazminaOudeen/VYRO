import { useEffect, useState, useMemo } from 'react';
import { Typography, Row, Col, Space, Button, App, Tag } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { GymClass } from '../types';
import { fetchSchedule, bookClass, getApiErrorMessage } from '../api/client';
import { useUser } from '../context/useUser';
import { ClassCard } from '../components/schedule/ClassCard';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function SchedulePage() {
    const { message } = App.useApp();
    const { currentUser, isStaff } = useUser();

    const [classes, setClasses] = useState<GymClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bookingClassId, setBookingClassId] = useState<number | null>(null);

    const loadSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSchedule();
            setClasses(data);
        } catch (err) {
            setError(getApiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        fetchSchedule()
            .then((data) => {
                if (!ignore) {
                    setClasses(data);
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
    }, []);

    // Group classes by day (YYYY-MM-DD)
    const groupedClasses = useMemo(() => {
        const groups: { [key: string]: { dateLabel: string; items: GymClass[] } } = {};

        classes.forEach((c) => {
            const dayKey = dayjs(c.startsAt).format('YYYY-MM-DD');
            if (!groups[dayKey]) {
                const itemDate = dayjs(c.startsAt);
                const today = dayjs().format('YYYY-MM-DD');
                const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

                let dateLabel = itemDate.format('dddd, MMM D');
                if (dayKey === today) dateLabel = `Today – ${dateLabel}`;
                else if (dayKey === tomorrow) dateLabel = `Tomorrow – ${dateLabel}`;

                groups[dayKey] = { dateLabel, items: [] };
            }
            groups[dayKey].items.push(c);
        });

        return Object.values(groups);
    }, [classes]);

    const handleBook = async (gymClass: GymClass) => {
        if (!currentUser) {
            message.warning('Please select a member profile from the top header to book a class.');
            return;
        }

        if (isStaff) {
            message.warning('Staff accounts cannot book classes. Switch to a Member profile in the header.');
            return;
        }

        setBookingClassId(gymClass.id);
        try {
            const booking = await bookClass(gymClass.id, currentUser.id);

            if (booking.status === 'BOOKED') {
                message.success({
                    content: `Reserved! You secured a seat in ${gymClass.title}.`,
                    duration: 4,
                });
            } else {
                message.info({
                    content: `Added to waitlist! You are #${booking.queuePosition} in line for ${gymClass.title}.`,
                    duration: 4,
                });
            }

            // Refresh availability numbers
            const updated = await fetchSchedule();
            setClasses(updated);
        } catch (err) {
            message.error({
                content: getApiErrorMessage(err),
                duration: 5,
            });
        } finally {
            setBookingClassId(null);
        }
    };

    if (loading) {
        return <LoadingState tip="Loading upcoming 7-day schedule..." />;
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to load schedule"
                message={error}
                onRetry={loadSchedule}
            />
        );
    }

    if (classes.length === 0) {
        return (
            <EmptyState
                title="No classes scheduled"
                description="There are currently no upcoming classes for the next 7 days. Please check back later."
                actionLabel="Refresh Schedule"
                onAction={loadSchedule}
            />
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 20,
                }}
            >
                <div>
                    <Typography.Title level={2} style={{ margin: 0 }}>
                        <CalendarOutlined style={{ marginRight: 10 }} />
                        Upcoming Class Schedule
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                        Next 7 days of training sessions. Book early or join the waitlist.
                    </Typography.Paragraph>
                </div>

                <Space>
                    <Button icon={<ReloadOutlined />} onClick={loadSchedule}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {/* Grouped Day-by-Day Schedule */}
            {groupedClasses.map(({ dateLabel, items }) => (
                <div key={dateLabel} style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <Typography.Title level={4} style={{ margin: 0 }}>
                            {dateLabel}
                        </Typography.Title>
                        <Tag color="default">{items.length} {items.length === 1 ? 'class' : 'classes'}</Tag>
                    </div>

                    <Row gutter={[16, 16]}>
                        {items.map((gymClass) => (
                            <Col xs={24} sm={12} lg={8} key={gymClass.id}>
                                <ClassCard
                                    gymClass={gymClass}
                                    onBook={handleBook}
                                    isBooking={bookingClassId === gymClass.id}
                                    isStaff={isStaff}
                                />
                            </Col>
                        ))}
                    </Row>
                </div>
            ))}
        </div>
    );
}
