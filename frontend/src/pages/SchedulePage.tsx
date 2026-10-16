import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Row, Col, Space, Tag, Button, Flex } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUser } from '../context/useUser';
import { fetchSchedule, bookClass, getApiErrorMessage } from '../api/client';
import { ClassCard } from '../components/schedule/ClassCard';
import { ClassDetailsModal } from '../components/schedule/ClassDetailsModal';
import { BookingResultModal } from '../components/booking/BookingResultModal';
import { BookingConflictModal } from '../components/booking/BookingConflictModal';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import type { GymClass, Booking } from '../types';

export function SchedulePage() {
  const navigate = useNavigate();
  const { currentUser, isStaff } = useUser();

  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingClassId, setBookingClassId] = useState<number | null>(null);

  // Modal States
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<GymClass | null>(null);
  const [bookingResult, setBookingResult] = useState<Booking | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictClass, setConflictClass] = useState<GymClass | null>(null);

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
      setConflictClass(gymClass);
      setConflictError('Please select a member profile from the top header to book a class.');
      return;
    }

    if (isStaff) {
      setConflictClass(gymClass);
      setConflictError(
        'Staff accounts cannot book classes. Switch to a Member profile in the header.'
      );
      return;
    }

    setBookingClassId(gymClass.id);
    try {
      const booking = await bookClass(gymClass.id, currentUser.id);

      // Pop up the professional confirmation dialog!
      setBookingResult(booking);

      // Refresh availability numbers
      const updated = await fetchSchedule();
      setClasses(updated);

      // Also update the details modal if it's currently open
      if (selectedClassForDetails?.id === gymClass.id) {
        const found = updated.find((c) => c.id === gymClass.id);
        if (found) setSelectedClassForDetails(found);
      }
    } catch (err) {
      // Pop up the professional conflict & next-step dialog!
      setConflictClass(gymClass);
      setConflictError(getApiErrorMessage(err));
    } finally {
      setBookingClassId(null);
    }
  };

  if (loading) {
    return <LoadingState tip="Loading gym class schedule..." />;
  }

  if (error) {
    return <ErrorState title="Could not load schedule" message={error} onRetry={loadSchedule} />;
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
      <Flex
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap={12}
        style={{ marginBottom: 24 }}
      >
        <div>
          <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>
            <CalendarOutlined style={{ marginRight: 10, color: '#00d084' }} />
            7-Day Class Schedule
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
            Explore scheduled fitness sessions. Reserve a confirmed seat or secure your priority
            spot on the waitlist.
          </Typography.Paragraph>
        </div>
        <Space>
          {isStaff && (
            <Tag color="gold" style={{ padding: '6px 12px', fontSize: 13, borderRadius: 16 }}>
              Viewing as Staff (Booking Disabled)
            </Tag>
          )}
          <Button icon={<ReloadOutlined />} onClick={loadSchedule}>
            Refresh
          </Button>
        </Space>
      </Flex>

      {/* Grouped Day Sections */}
      <Space direction="vertical" size={28} style={{ width: '100%' }}>
        {groupedClasses.map((group) => (
          <div key={group.dateLabel}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
                {group.dateLabel}
              </Typography.Title>
              <Tag style={{ borderRadius: 12 }}>
                {group.items.length} {group.items.length === 1 ? 'class' : 'classes'}
              </Tag>
            </div>

            {/* Cards Grid */}
            <Row gutter={[16, 16]}>
              {group.items.map((gymClass) => (
                <Col key={gymClass.id} xs={24} sm={12} md={8} lg={8} xl={6}>
                  <ClassCard
                    gymClass={gymClass}
                    onBook={handleBook}
                    onViewDetails={(c) => setSelectedClassForDetails(c)}
                    isBooking={bookingClassId === gymClass.id}
                    isStaff={isStaff}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Space>

      {/* Rich Class Details Modal */}
      <ClassDetailsModal
        gymClass={selectedClassForDetails}
        open={!!selectedClassForDetails}
        onClose={() => setSelectedClassForDetails(null)}
        onBook={handleBook}
        isBooking={bookingClassId === selectedClassForDetails?.id}
        isStaff={isStaff}
      />

      {/* Enterprise Booking Confirmation Dialog */}
      <BookingResultModal
        booking={bookingResult}
        open={!!bookingResult}
        onClose={() => setBookingResult(null)}
        onViewMyBookings={() => {
          setBookingResult(null);
          navigate('/my-bookings');
        }}
      />

      {/* Actionable Rule & Conflict Exception Dialog */}
      <BookingConflictModal
        open={!!conflictError}
        error={conflictError}
        gymClass={conflictClass}
        onClose={() => {
          setConflictError(null);
          setConflictClass(null);
        }}
        onViewMyBookings={() => {
          setConflictError(null);
          setConflictClass(null);
          navigate('/my-bookings');
        }}
      />
    </div>
  );
}
