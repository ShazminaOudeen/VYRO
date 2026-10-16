import type { Booking } from '../types';

/**
 * Generates and downloads an RFC 5545 standard .ics calendar invite file.
 * Compatible with Google Calendar, Apple Calendar, Outlook, and mobile calendars.
 */
export function downloadBookingIcs(booking: Booking) {
    const formatDateToIcs = (isoStr: string) => {
        const d = new Date(isoStr);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startUtc = formatDateToIcs(booking.startsAt);
    const endUtc = formatDateToIcs(booking.endsAt);
    const nowUtc = formatDateToIcs(new Date().toISOString());

    const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//VYRO Fitness//Gym Class Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:vyro-booking-${booking.id}-${booking.classId}@vyro.lk`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${startUtc}`,
        `DTEND:${endUtc}`,
        `SUMMARY:VYRO: ${booking.classTitle} with Coach ${booking.coach}`,
        `DESCRIPTION:Confirmed reservation for ${booking.memberName} at VYRO Fitness.\\nClass: ${booking.classTitle}\\nDuration: ${booking.durationMinutes} mins\\nCoach: ${booking.coach}.`,
        'LOCATION:VYRO Fitness Club, Colombo, Sri Lanka',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ];

    const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = booking.classTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
    a.download = `vyro-${sanitizedTitle}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
