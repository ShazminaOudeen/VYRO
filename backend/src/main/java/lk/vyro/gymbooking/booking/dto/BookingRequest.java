package lk.vyro.gymbooking.booking.dto;

import jakarta.validation.constraints.NotNull;

public record BookingRequest(
    @NotNull(message = "Class ID is required")
    Long classId,

    @NotNull(message = "Member ID is required")
    Long memberId
) {}
