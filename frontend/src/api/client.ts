import axios, { isAxiosError } from 'axios';
import type { Booking, CreateClassRequest, GymClass, User, ApiError } from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach acting user ID header from localStorage to every outgoing request
api.interceptors.request.use((config) => {
    const storedUserId = localStorage.getItem('vyro-user-id');
    if (storedUserId) {
        config.headers['X-Acting-User'] = storedUserId;
        config.headers['X-User-Id'] = storedUserId;
    }
    return config;
});


/**
 * Extracts a readable human-friendly message from an API error response.
 */
export function getApiErrorMessage(error: unknown): string {
    if (isAxiosError(error) && error.response?.data) {
        const data = error.response.data as ApiError;
        if (data.message) {
            return data.message;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
}

// ----------------- API Endpoints -----------------

export async function fetchSchedule(): Promise<GymClass[]> {
    const res = await api.get<GymClass[]>('/api/classes');
    return res.data;
}

export async function fetchClassById(id: number): Promise<GymClass> {
    const res = await api.get<GymClass>(`/api/classes/${id}`);
    return res.data;
}

export async function createGymClass(data: CreateClassRequest): Promise<GymClass> {
    const res = await api.post<GymClass>('/api/classes', data);
    return res.data;
}

export async function fetchClassRoster(classId: number): Promise<Booking[]> {
    const res = await api.get<Booking[]>(`/api/classes/${classId}/roster`);
    return res.data;
}

export async function bookClass(classId: number, memberId: number): Promise<Booking> {
    const res = await api.post<Booking>(`/api/classes/${classId}/bookings`, { classId, memberId });
    return res.data;
}

export async function cancelBooking(bookingId: number, memberId?: number): Promise<Booking> {
    const params = memberId ? { memberId } : undefined;
    const res = await api.post<Booking>(`/api/bookings/${bookingId}/cancel`, null, { params });
    return res.data;
}


export async function fetchMyBookings(memberId: number): Promise<Booking[]> {
    const res = await api.get<Booking[]>(`/api/members/${memberId}/bookings`);
    return res.data;
}

export async function fetchUsers(): Promise<User[]> {
    const res = await api.get<User[]>('/api/users');
    return res.data;
}

export async function resetDemoData(): Promise<{ status: string; message: string }> {
    const res = await api.post<{ status: string; message: string }>('/api/dev/reset');
    return res.data;
}

