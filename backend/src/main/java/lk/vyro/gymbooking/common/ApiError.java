package lk.vyro.gymbooking.common;

import java.time.Instant;

public record ApiError(
    Instant timestamp,
    int status,
    ErrorCode errorCode,
    String message,
    String path
) {}
