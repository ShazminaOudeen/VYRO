package lk.vyro.gymbooking.config;

import lk.vyro.gymbooking.booking.Booking;
import lk.vyro.gymbooking.booking.BookingRepository;
import lk.vyro.gymbooking.booking.BookingStatus;
import lk.vyro.gymbooking.gymclass.GymClass;
import lk.vyro.gymbooking.gymclass.GymClassRepository;
import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;
import lk.vyro.gymbooking.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final GymClassRepository gymClassRepository;
    private final BookingRepository bookingRepository;
    private final Clock clock;

    public DataSeeder(UserRepository userRepository,
                      GymClassRepository gymClassRepository,
                      BookingRepository bookingRepository,
                      Clock clock) {
        this.userRepository = userRepository;
        this.gymClassRepository = gymClassRepository;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0 || gymClassRepository.count() > 0) {
            return;
        }

        // 1. Seed App Users (3 members, 1 staff)
        AppUser staff = userRepository.save(new AppUser("Coach Kamal", "kamal@vyro.lk", Role.STAFF));
        AppUser member1 = userRepository.save(new AppUser("Kasun Perera", "kasun@gmail.com", Role.MEMBER));
        AppUser member2 = userRepository.save(new AppUser("Nimna Silva", "nimna@gmail.com", Role.MEMBER));
        AppUser member3 = userRepository.save(new AppUser("Shazmina Oudeen", "shazmina@gmail.com", Role.MEMBER));
        AppUser member4 = userRepository.save(new AppUser("Dinuka Fernando", "dinuka@gmail.com", Role.MEMBER));

        ZoneId colomboZone = ZoneId.of("Asia/Colombo");
        ZonedDateTime colomboNow = ZonedDateTime.now(clock.withZone(colomboZone)).truncatedTo(ChronoUnit.MINUTES);
        Instant createdAt = colomboNow.minusDays(1).toInstant();

        // 2. Seed 8 Classes across the next 7 days
        // Class 1: Starts in 75 minutes (WITHIN 2-HOUR CUTOFF WINDOW)
        GymClass classStartingSoon = gymClassRepository.save(new GymClass(
                "HIIT Blast Express", "Coach Kamal",
                colomboNow.plusMinutes(75).toInstant(),
                45, 10, createdAt
        ));

        // Class 2: FULL class with WAITLIST (capacity = 2)
        GymClass fullClass = gymClassRepository.save(new GymClass(
                "CrossFit Foundations", "Coach Kamal",
                colomboNow.plusDays(1).withHour(18).withMinute(0).toInstant(),
                60, 2, createdAt
        ));

        // Other classes over the next 7 days
        GymClass class3 = gymClassRepository.save(new GymClass(
                "Sunrise Yoga Flow", "Yogini Sarah",
                colomboNow.plusDays(1).withHour(6).withMinute(30).toInstant(),
                60, 15, createdAt
        ));
        GymClass class4 = gymClassRepository.save(new GymClass(
                "Power Pilates", "Elena Rostova",
                colomboNow.plusDays(2).withHour(10).withMinute(0).toInstant(),
                50, 12, createdAt
        ));
        GymClass class5 = gymClassRepository.save(new GymClass(
                "Spin & Sprint Cycling", "Coach Kamal",
                colomboNow.plusDays(3).withHour(17).withMinute(30).toInstant(),
                45, 20, createdAt
        ));
        GymClass class6 = gymClassRepository.save(new GymClass(
                "Olympic Weightlifting", "Marcus Vance",
                colomboNow.plusDays(4).withHour(19).withMinute(0).toInstant(),
                90, 8, createdAt
        ));
        GymClass class7 = gymClassRepository.save(new GymClass(
                "Box & Burn Conditioning", "Coach Kamal",
                colomboNow.plusDays(5).withHour(8).withMinute(0).toInstant(),
                60, 15, createdAt
        ));
        GymClass class8 = gymClassRepository.save(new GymClass(
                "Recovery Mobility & Stretch", "Yogini Sarah",
                colomboNow.plusDays(6).withHour(16).withMinute(0).toInstant(),
                45, 25, createdAt
        ));

        // 3. Seed Bookings for the Full Class (capacity 2: 2 BOOKED, 1 WAITLISTED)
        bookingRepository.save(new Booking(fullClass, member1, BookingStatus.BOOKED, createdAt.plusSeconds(10)));
        bookingRepository.save(new Booking(fullClass, member2, BookingStatus.BOOKED, createdAt.plusSeconds(20)));
        bookingRepository.save(new Booking(fullClass, member3, BookingStatus.WAITLISTED, createdAt.plusSeconds(30)));

        // 4. Seed a booking for the class starting soon
        bookingRepository.save(new Booking(classStartingSoon, member1, BookingStatus.BOOKED, createdAt.plusSeconds(40)));

        log.info("Seeded initial database: 5 users, 8 classes, and initial bookings");
    }
}

    
