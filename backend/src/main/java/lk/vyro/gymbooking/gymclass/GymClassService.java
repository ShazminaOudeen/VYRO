package lk.vyro.gymbooking.gymclass;

import lk.vyro.gymbooking.booking.Booking;
import lk.vyro.gymbooking.booking.BookingRepository;
import lk.vyro.gymbooking.booking.BookingStatus;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import lk.vyro.gymbooking.common.NotFoundException;
import lk.vyro.gymbooking.gymclass.dto.CreateClassRequest;
import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class GymClassService {

    private final GymClassRepository gymClassRepository;
    private final BookingRepository bookingRepository;
    private final Clock clock;

    public GymClassService(GymClassRepository gymClassRepository,
                           BookingRepository bookingRepository,
                           Clock clock) {
        this.gymClassRepository = gymClassRepository;
        this.bookingRepository = bookingRepository;
        this.clock = clock;
    }

    @Transactional
    public GymClassResponse createClass(CreateClassRequest request) {
        Instant now = Instant.now(clock);
        if (!request.startsAt().isAfter(now)) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Class start time must be in the future");
        }

        GymClass gymClass = new GymClass(
                request.title().trim(),
                request.coach().trim(),
                request.startsAt(),
                request.durationMinutes(),
                request.capacity(),
                now
        );

        GymClass saved = gymClassRepository.save(gymClass);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<GymClassResponse> getScheduleNext7Days() {
        return getScheduleNext7Days(null);
    }

    @Transactional(readOnly = true)
    public List<GymClassResponse> getScheduleNext7Days(Long memberId) {
        Instant now = Instant.now(clock);
        Instant end = now.plus(Duration.ofDays(7));
        List<GymClass> classes = gymClassRepository.findByStartsAtBetweenOrderByStartsAtAsc(now, end);

        List<Booking> activeBookings = (memberId != null)
                ? bookingRepository.findActiveBookingsByMember(memberId)
                : List.of();

        return classes.stream()
                .map(c -> toResponseWithClash(c, activeBookings))
                .toList();
    }

    @Transactional(readOnly = true)
    public GymClassResponse getClassById(Long id) {
        GymClass gymClass = gymClassRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found with id: " + id));
        return toResponse(gymClass);
    }

    public GymClassResponse toResponse(GymClass gymClass) {
        return toResponseWithClash(gymClass, List.of());
    }

    private GymClassResponse toResponseWithClash(GymClass gymClass, List<Booking> activeBookings) {
        long bookedCount = bookingRepository.countByGymClassIdAndStatus(gymClass.getId(), BookingStatus.BOOKED);
        long waitlistCount = bookingRepository.countByGymClassIdAndStatus(gymClass.getId(), BookingStatus.WAITLISTED);
        int seatsLeft = Math.max(0, gymClass.getCapacity() - (int) bookedCount);
        boolean isFull = seatsLeft == 0;

        String clashesWith = null;
        for (Booking b : activeBookings) {
            if (!b.getGymClass().getId().equals(gymClass.getId())) {
                Instant bStart = b.getGymClass().getStartsAt();
                Instant bEnd = b.getGymClass().getEndsAt();
                // Two intervals [start, end) overlap if start < bEnd && end > bStart
                if (gymClass.getStartsAt().isBefore(bEnd) && gymClass.getEndsAt().isAfter(bStart)) {
                    clashesWith = b.getGymClass().getTitle();
                    break;
                }
            }
        }

        return new GymClassResponse(
                gymClass.getId(),
                gymClass.getTitle(),
                gymClass.getCoach(),
                gymClass.getStartsAt(),
                gymClass.getEndsAt(),
                gymClass.getDurationMinutes(),
                gymClass.getCapacity(),
                bookedCount,
                seatsLeft,
                waitlistCount,
                isFull,
                clashesWith
        );
    }
}
