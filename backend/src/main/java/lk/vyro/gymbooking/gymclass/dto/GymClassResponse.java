package lk.vyro.gymbooking.gymclass.dto;

import java.time.Instant;

public record GymClassResponse(
    Long id,
    String title,
    String coach,
    Instant startsAt,
    Instant endsAt,
    int durationMinutes,
    int capacity,
    long bookedCount,
    int seatsLeft,
    long waitlistCount,
    boolean isFull
) {}
