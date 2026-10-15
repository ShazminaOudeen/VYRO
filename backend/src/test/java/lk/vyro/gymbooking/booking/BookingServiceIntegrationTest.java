package lk.vyro.gymbooking.booking;

import lk.vyro.gymbooking.booking.dto.BookingRequest;
import lk.vyro.gymbooking.booking.dto.BookingResponse;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import lk.vyro.gymbooking.gymclass.GymClass;
import lk.vyro.gymbooking.gymclass.GymClassRepository;
import lk.vyro.gymbooking.testutil.MutableClock;
import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;
import lk.vyro.gymbooking.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class BookingServiceIntegrationTest {

    @TestConfiguration
    static class TestClockConfig {
        @Bean
        @Primary
        public MutableClock mutableClock() {
            return MutableClock.at("2026-10-15T10:00:00Z");
        }
    }

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GymClassRepository gymClassRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MutableClock clock;

    private AppUser member1;
    private AppUser member2;
    private AppUser member3;

    @BeforeEach
    void setUp() {
        clock.setInstant(Instant.parse("2026-10-15T10:00:00Z"));

        String unique = UUID.randomUUID().toString().substring(0, 8);
        member1 = userRepository.save(new AppUser("Member One " + unique, "m1." + unique + "@vyro.lk", Role.MEMBER));
        member2 = userRepository.save(new AppUser("Member Two " + unique, "m2." + unique + "@vyro.lk", Role.MEMBER));
        member3 = userRepository.save(new AppUser("Member Three " + unique, "m3." + unique + "@vyro.lk", Role.MEMBER));
    }

    private GymClass createClass(String title, Instant startsAt, int durationMinutes, int capacity) {
        return gymClassRepository.save(new GymClass(title, "Coach Kamal", startsAt, durationMinutes, capacity, clock.instant()));
    }

    @Test
    @DisplayName("Rule 1: Booking with free seats gives status BOOKED")
    void bookWithFreeSeats_givesBookedStatus() {
        Instant classStart = clock.instant().plus(Duration.ofHours(3));
        GymClass gymClass = createClass("Yoga Flow", classStart, 60, 5);

        BookingResponse response = bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId()));

        assertThat(response.status()).isEqualTo(BookingStatus.BOOKED);
        assertThat(response.queuePosition()).isNull();

    }

    @Test
    @DisplayName("Rule 1: Booking full class joins waitlist in deterministic FIFO queue order")
    void bookFullClass_joinsWaitlistInFifoOrder() {
        Instant classStart = clock.instant().plus(Duration.ofHours(3));
        GymClass gymClass = createClass("CrossFit Solo", classStart, 60, 1);

        BookingResponse r1 = bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId()));
        assertThat(r1.status()).isEqualTo(BookingStatus.BOOKED);

        BookingResponse r2 = bookingService.bookClass(new BookingRequest(gymClass.getId(), member2.getId()));
        assertThat(r2.status()).isEqualTo(BookingStatus.WAITLISTED);
        assertThat(r2.queuePosition()).isEqualTo(1L);

        BookingResponse r3 = bookingService.bookClass(new BookingRequest(gymClass.getId(), member3.getId()));
        assertThat(r3.status()).isEqualTo(BookingStatus.WAITLISTED);
        assertThat(r3.queuePosition()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Rule 2: Duplicate booking for same class is refused")
    void duplicateBooking_isRefused() {
        Instant classStart = clock.instant().plus(Duration.ofHours(3));
        GymClass gymClass = createClass("Spin Blast", classStart, 45, 5);

        bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId()));

        assertThatThrownBy(() -> bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId())))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_BOOKING));
    }

    @Test
    @DisplayName("Rule 3: Booking a class that already started or finished is refused")
    void pastClass_isRefused() {
        Instant classStart = clock.instant().plus(Duration.ofHours(1));
        GymClass gymClass = createClass("HIIT Sprint", classStart, 30, 10);

        // Advance clock past the class start time
        clock.advance(Duration.ofHours(2));

        assertThatThrownBy(() -> bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId())))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getErrorCode()).isEqualTo(ErrorCode.CLASS_ALREADY_STARTED));
    }

    @Test
    @DisplayName("Rule 6: Overlapping class booking is refused")
    void overlappingClass_isRefused() {
        Instant start1 = clock.instant().plus(Duration.ofHours(3));
        GymClass class1 = createClass("Morning Yoga", start1, 60, 10); // 13:00 - 14:00

        Instant start2 = start1.plus(Duration.ofMinutes(30)); // 13:30 - 14:30 (overlaps with class1)
        GymClass class2 = createClass("Noon Pilates", start2, 60, 10);

        bookingService.bookClass(new BookingRequest(class1.getId(), member1.getId()));

        assertThatThrownBy(() -> bookingService.bookClass(new BookingRequest(class2.getId(), member1.getId())))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getErrorCode()).isEqualTo(ErrorCode.OVERLAPPING_CLASS));
    }

    @Test
    @DisplayName("Rule 4: Cancel before 2-hour cutoff succeeds; after cutoff is refused")
    void cancellationCutoff_enforced() {
        Instant classStart = clock.instant().plus(Duration.ofHours(3)); // starts at 13:00
        GymClass gymClass = createClass("Kettlebell Burn", classStart, 45, 5);

        BookingResponse booking = bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId()));

        // Advance clock by 1 hour and 30 minutes -> now at 11:30 (1.5 hours before start; past 2-hour cutoff)
        clock.advance(Duration.ofMinutes(90));

        assertThatThrownBy(() -> bookingService.cancelBooking(booking.id(), member1.getId()))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> assertThat(((BusinessRuleException) ex).getErrorCode()).isEqualTo(ErrorCode.CANCELLATION_WINDOW_PASSED));

        // Rewind clock back to 10:30 (2.5 hours before start) -> cancel succeeds
        clock.setInstant(Instant.parse("2026-10-15T10:30:00Z"));
        BookingResponse cancelled = bookingService.cancelBooking(booking.id(), member1.getId());
        assertThat(cancelled.status()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    @DisplayName("Rule 5: When a BOOKED member cancels, the first waitlisted member is promoted")
    void waitlistPromotion_onCancel() {
        Instant classStart = clock.instant().plus(Duration.ofHours(4));
        GymClass gymClass = createClass("Boxing Basics", classStart, 60, 1);

        BookingResponse b1 = bookingService.bookClass(new BookingRequest(gymClass.getId(), member1.getId()));
        BookingResponse b2 = bookingService.bookClass(new BookingRequest(gymClass.getId(), member2.getId()));

        assertThat(b1.status()).isEqualTo(BookingStatus.BOOKED);
        assertThat(b2.status()).isEqualTo(BookingStatus.WAITLISTED);

        // Member 1 cancels -> Member 2 should be promoted to BOOKED
        bookingService.cancelBooking(b1.id(), member1.getId());

        Booking member2Booking = bookingRepository.findById(b2.id()).orElseThrow();
        assertThat(member2Booking.getStatus()).isEqualTo(BookingStatus.BOOKED);
    }

    @Test
    @DisplayName("Rule 5 & 6: Waitlist promotion skips a member who has an overlapping active class")
    void waitlistPromotion_skipsOverlappingCandidate() {
        Instant classAStart = clock.instant().plus(Duration.ofHours(4)); // 14:00 - 15:00
        GymClass classA = createClass("Class A", classAStart, 60, 1);

        BookingResponse a1 = bookingService.bookClass(new BookingRequest(classA.getId(), member1.getId()));
        BookingResponse a2 = bookingService.bookClass(new BookingRequest(classA.getId(), member2.getId())); // waitlisted #1
        BookingResponse a3 = bookingService.bookClass(new BookingRequest(classA.getId(), member3.getId())); // waitlisted #2

        assertThat(a1.status()).isEqualTo(BookingStatus.BOOKED);
        assertThat(a2.status()).isEqualTo(BookingStatus.WAITLISTED);
        assertThat(a3.status()).isEqualTo(BookingStatus.WAITLISTED);

        // While waitlisted for Class A, member 2 books Class B which overlaps with Class A (14:30 - 15:30)
        GymClass classB = createClass("Class B", classAStart.plus(Duration.ofMinutes(30)), 60, 5);
        BookingResponse b2 = bookingService.bookClass(new BookingRequest(classB.getId(), member2.getId()));
        assertThat(b2.status()).isEqualTo(BookingStatus.BOOKED);

        // Now Member 1 cancels Class A.
        // Member 2 overlaps with Class B, so Member 2 must be SKIPPED!
        // Member 3 must be promoted to BOOKED!
        bookingService.cancelBooking(a1.id(), member1.getId());

        Booking member2After = bookingRepository.findById(a2.id()).orElseThrow();
        Booking member3After = bookingRepository.findById(a3.id()).orElseThrow();

        assertThat(member2After.getStatus()).isEqualTo(BookingStatus.WAITLISTED); // skipped
        assertThat(member3After.getStatus()).isEqualTo(BookingStatus.BOOKED);     // promoted!
    }
}
