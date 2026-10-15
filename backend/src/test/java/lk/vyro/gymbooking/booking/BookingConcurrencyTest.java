package lk.vyro.gymbooking.booking;

import lk.vyro.gymbooking.booking.dto.BookingRequest;
import lk.vyro.gymbooking.gymclass.GymClass;
import lk.vyro.gymbooking.gymclass.GymClassRepository;
import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;
import lk.vyro.gymbooking.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private GymClassRepository gymClassRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Concurrency: Two parallel bookings for the last seat -> exactly 1 BOOKED and 1 WAITLISTED")
    void concurrentBookingsForLastSeat_serializesCorrectly() throws Exception {
        // 1. Setup a class with capacity = 1
        String unique = UUID.randomUUID().toString().substring(0, 8);
        Instant startsAt = Instant.now().plus(Duration.ofDays(2));
        GymClass gymClass = gymClassRepository.save(new GymClass(
                "Final Seat Showdown " + unique,
                "Coach Kamal",
                startsAt,
                60,
                1, // capacity = 1
                Instant.now()
        ));

        // 2. Setup 2 distinct members
        AppUser memberA = userRepository.save(new AppUser("Racer A " + unique, "a." + unique + "@vyro.lk", Role.MEMBER));
        AppUser memberB = userRepository.save(new AppUser("Racer B " + unique, "b." + unique + "@vyro.lk", Role.MEMBER));

        // 3. Thread orchestration using CountDownLatch for simultaneous firing
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startGun = new CountDownLatch(1);

        Future<?> futureA = executor.submit(() -> {
            try {
                readyLatch.countDown();
                startGun.await(); // wait for firing gun
                bookingService.bookClass(new BookingRequest(gymClass.getId(), memberA.getId()));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        Future<?> futureB = executor.submit(() -> {
            try {
                readyLatch.countDown();
                startGun.await(); // wait for firing gun
                bookingService.bookClass(new BookingRequest(gymClass.getId(), memberB.getId()));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        // Wait until both threads are at the starting line, then fire simultaneously!
        readyLatch.await(5, TimeUnit.SECONDS);
        startGun.countDown();

        // Wait for both to finish execution
        futureA.get(10, TimeUnit.SECONDS);
        futureB.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // 4. Verify outcomes in the database
        long bookedCount = bookingRepository.countByGymClassIdAndStatus(gymClass.getId(), BookingStatus.BOOKED);
        long waitlistCount = bookingRepository.countByGymClassIdAndStatus(gymClass.getId(), BookingStatus.WAITLISTED);

        assertThat(bookedCount)
                .as("Exactly one member must secure the single seat")
                .isEqualTo(1);

        assertThat(waitlistCount)
                .as("The other member must be placed on the waitlist")
                .isEqualTo(1);
    }
}
