package lk.vyro.gymbooking.booking;

import jakarta.persistence.*;
import lk.vyro.gymbooking.gymclass.GymClass;
import lk.vyro.gymbooking.user.AppUser;

import java.time.Instant;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private GymClass gymClass;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private AppUser member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private BookingStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    public Booking() {
    }

    public Booking(Long id, GymClass gymClass, AppUser member, BookingStatus status, Instant createdAt, Instant cancelledAt) {
        this.id = id;
        this.gymClass = gymClass;
        this.member = member;
        this.status = status;
        this.createdAt = createdAt;
        this.cancelledAt = cancelledAt;
    }

    public Booking(GymClass gymClass, AppUser member, BookingStatus status, Instant createdAt) {
        this(null, gymClass, member, status, createdAt, null);
    }

    public Long getId() {
        return id;
    }

    public GymClass getGymClass() {
        return gymClass;
    }

    public void setGymClass(GymClass gymClass) {
        this.gymClass = gymClass;
    }

    public AppUser getMember() {
        return member;
    }

    public void setMember(AppUser member) {
        this.member = member;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }
}
