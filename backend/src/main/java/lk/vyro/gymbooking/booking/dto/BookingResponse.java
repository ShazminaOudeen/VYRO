package lk.vyro.gymbooking.booking.dto;

import lk.vyro.gymbooking.booking.BookingStatus;

import java.time.Instant;

public record BookingResponse(
    Long id,
    Long classId,
    String classTitle,
    String coach,
    Instant startsAt,
    Instant endsAt,
    int durationMinutes,
    Long memberId,
    String memberName,
    BookingStatus status,
    Long queuePosition,
    Instant createdAt,
    Instant cancelledAt,
    boolean canCancel,
    String cancelDisabledReason
) {}
