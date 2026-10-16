export type Role = 'MEMBER' | 'STAFF';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type BookingStatus = 'BOOKED' | 'WAITLISTED' | 'CANCELLED';

export interface GymClass {
  id: number;
  title: string;
  coach: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
  seatsLeft: number;
  waitlistCount: number;
  isFull: boolean;
}

export interface Booking {
  id: number;
  classId: number;
  classTitle: string;
  coach: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  memberId: number;
  memberName: string;
  status: BookingStatus;
  queuePosition: number | null;
  createdAt: string;
  cancelledAt: string | null;
  canCancel: boolean;
  cancelDisabledReason: string | null;
}

export interface CreateClassRequest {
  title: string;
  coach: string;
  startsAt: string;
  durationMinutes: number;
  capacity: number;
}

export interface ApiError {
  code?: string;
  message?: string;
}
