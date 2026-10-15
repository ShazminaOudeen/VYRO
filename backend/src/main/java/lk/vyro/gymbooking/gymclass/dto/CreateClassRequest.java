package lk.vyro.gymbooking.gymclass.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateClassRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 120, message = "Title must not exceed 120 characters")
    String title,

    @NotBlank(message = "Coach name is required")
    @Size(max = 100, message = "Coach name must not exceed 100 characters")
    String coach,

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    Instant startsAt,

    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be between 15 and 180 minutes")
    @Max(value = 180, message = "Duration must be between 15 and 180 minutes")
    Integer durationMinutes,

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be between 1 and 50")
    @Max(value = 50, message = "Capacity must be between 1 and 50")
    Integer capacity
) {}
