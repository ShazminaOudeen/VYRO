CREATE TABLE app_users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    role       VARCHAR(10)  NOT NULL,
    CONSTRAINT chk_user_role CHECK (role IN ('MEMBER', 'STAFF'))
);

CREATE TABLE gym_classes (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    title            VARCHAR(120) NOT NULL,
    coach            VARCHAR(100) NOT NULL,
    starts_at        DATETIME(6)  NOT NULL,
    duration_minutes INT          NOT NULL,
    capacity         INT          NOT NULL,
    created_at       DATETIME(6)  NOT NULL,
    CONSTRAINT chk_capacity CHECK (capacity BETWEEN 1 AND 50),
    CONSTRAINT chk_duration CHECK (duration_minutes BETWEEN 15 AND 180)
);

CREATE INDEX idx_gym_classes_starts_at ON gym_classes (starts_at);

CREATE TABLE bookings (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    class_id     BIGINT      NOT NULL,
    member_id    BIGINT      NOT NULL,
    status       VARCHAR(12) NOT NULL,
    created_at   DATETIME(6) NOT NULL,
    cancelled_at DATETIME(6) NULL,
    CONSTRAINT fk_booking_class  FOREIGN KEY (class_id)  REFERENCES gym_classes (id),
    CONSTRAINT fk_booking_member FOREIGN KEY (member_id) REFERENCES app_users (id),
    CONSTRAINT chk_booking_status CHECK (status IN ('BOOKED', 'WAITLISTED', 'CANCELLED'))
);

CREATE INDEX idx_bookings_class_status_created ON bookings (class_id, status, created_at, id);
CREATE INDEX idx_bookings_member_status ON bookings (member_id, status);