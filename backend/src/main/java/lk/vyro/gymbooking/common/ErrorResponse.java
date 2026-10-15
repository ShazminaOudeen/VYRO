package lk.vyro.gymbooking.common;

import java.time.Instant;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path
) {}
