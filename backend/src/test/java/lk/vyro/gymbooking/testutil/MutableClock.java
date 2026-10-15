package lk.vyro.gymbooking.testutil;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Thread-safe mutable Clock implementation for deterministic time testing.
 */
public class MutableClock extends Clock {

    private volatile Instant currentInstant;
    private final ZoneId zone;

    public MutableClock(Instant initialInstant) {
        this(initialInstant, ZoneOffset.UTC);
    }

    public MutableClock(Instant initialInstant, ZoneId zone) {
        this.currentInstant = initialInstant;
        this.zone = zone;
    }

    public static MutableClock at(String isoInstant) {
        return new MutableClock(Instant.parse(isoInstant));
    }

    public void setInstant(Instant instant) {
        this.currentInstant = instant;
    }

    public void advance(Duration duration) {
        this.currentInstant = this.currentInstant.plus(duration);
    }

    @Override
    public ZoneId getZone() {
        return zone;
    }

    @Override
    public Clock withZone(ZoneId zone) {
        return new MutableClock(this.currentInstant, zone);
    }

    @Override
    public Instant instant() {
        return currentInstant;
    }
}
