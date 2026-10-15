package lk.vyro.gymbooking.booking;

import lk.vyro.gymbooking.booking.dto.BookingRequest;
import lk.vyro.gymbooking.booking.dto.BookingResponse;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import lk.vyro.gymbooking.common.NotFoundException;
import lk.vyro.gymbooking.gymclass.GymClass;
import lk.vyro.gymbooking.gymclass.GymClassRepository;
import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;
import lk.vyro.gymbooking.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final GymClassRepository gymClassRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public BookingService(BookingRepository bookingRepository,
                          GymClassRepository gymClassRepository,
                          UserRepository userRepository,
                          Clock clock) {
        this.bookingRepository = bookingRepository;
        this.gymClassRepository = gymClassRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional
    public BookingResponse bookClass(BookingRequest request) {
        Instant now = Instant.now(clock);

        // 1. Lock the class row to serialize concurrent booking requests
        GymClass gymClass = gymClassRepository.findByIdForUpdate(request.classId())
                .orElseThrow(() -> new NotFoundException("Class not found with id: " + request.classId()));

        AppUser member = userRepository.findById(request.memberId())
                .orElseThrow(() -> new NotFoundException("User not found with id: " + request.memberId()));

        if (member.getRole() != Role.MEMBER) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Only members can book classes");
        }

        // Rule 3: Cannot book a class that has already started or finished
        if (!gymClass.getStartsAt().isAfter(now)) {
            throw new BusinessRuleException(ErrorCode.CLASS_ALREADY_STARTED, "Cannot book a class that has already started or finished");
        }

        // Rule 2: No duplicate active booking (BOOKED or WAITLISTED)
        boolean hasActiveBooking = bookingRepository.existsByGymClassIdAndMemberIdAndStatusIn(
                gymClass.getId(),
                member.getId(),
                List.of(BookingStatus.BOOKED, BookingStatus.WAITLISTED)
        );
        if (hasActiveBooking) {
            throw new BusinessRuleException(ErrorCode.DUPLICATE_BOOKING, "You already have an active booking or waitlist entry for this class");
        }

        // Rule 6: Check for overlapping BOOKED classes
        boolean hasOverlap = hasOverlappingBooking(member.getId(), gymClass.getStartsAt(), gymClass.getEndsAt(), gymClass.getId());
        if (hasOverlap) {
            throw new BusinessRuleException(ErrorCode.OVERLAPPING_CLASS, "You are already booked into an overlapping class at this time");
        }

        // Rule 1: Free seat gives BOOKED, full class gives WAITLISTED
        long bookedCount = bookingRepository.countByGymClassIdAndStatus(gymClass.getId(), BookingStatus.BOOKED);
        BookingStatus status = (bookedCount < gymClass.getCapacity()) ? BookingStatus.BOOKED : BookingStatus.WAITLISTED;

        Booking booking = new Booking(gymClass, member, status, now);
        Booking saved = bookingRepository.save(booking);

        return toResponse(saved, now);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long memberId) {
        Instant now = Instant.now(clock);

        Booking booking = bookingRepository.findByIdAndMemberId(bookingId, memberId)
                .orElseThrow(() -> new NotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "This booking has already been cancelled");
        }

        // Lock class row before processing cancellation and waitlist promotion
        GymClass gymClass = gymClassRepository.findByIdForUpdate(booking.getGymClass().getId())
                .orElseThrow(() -> new NotFoundException("Class not found with id: " + booking.getGymClass().getId()));

        // Rule 4: Cancellation allowed up to 2 hours before class start
        Instant cutoff = gymClass.getStartsAt().minus(Duration.ofHours(2));
        if (now.isAfter(cutoff)) {
            throw new BusinessRuleException(ErrorCode.CANCELLATION_WINDOW_PASSED, "Cancellation is only permitted up to 2 hours before class start time");
        }

        BookingStatus previousStatus = booking.getStatus();
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(now);
        Booking saved = bookingRepository.save(booking);

        // Rule 5: When a BOOKED member cancels, promote the first eligible waitlisted member
        if (previousStatus == BookingStatus.BOOKED) {
            promoteNextEligibleWaitlistedMember(gymClass, now);
        }

        return toResponse(saved, now);
    }

    private void promoteNextEligibleWaitlistedMember(GymClass gymClass, Instant now) {
        List<Booking> waitlist = bookingRepository.findByGymClassIdAndStatusOrderByCreatedAtAscIdAsc(
                gymClass.getId(),
                BookingStatus.WAITLISTED
        );

        for (Booking candidate : waitlist) {
            // Check if this candidate has an overlapping BOOKED class now
            boolean overlap = hasOverlappingBooking(
                    candidate.getMember().getId(),
                    gymClass.getStartsAt(),
                    gymClass.getEndsAt(),
                    gymClass.getId()
            );

            if (!overlap) {
                // Promote to BOOKED!
                candidate.setStatus(BookingStatus.BOOKED);
                bookingRepository.save(candidate);
                break; // One seat freed, one candidate promoted
            }
            // If they overlap, skip them and inspect the next waitlisted person
        }
    }

    public boolean hasOverlappingBooking(Long memberId, Instant start, Instant end, Long currentClassId) {
        List<Booking> activeBookings = bookingRepository.findActiveBookingsByMember(memberId);
        return activeBookings.stream()
                .filter(b -> !b.getGymClass().getId().equals(currentClassId))
                .anyMatch(b -> {
                    Instant bStart = b.getGymClass().getStartsAt();
                    Instant bEnd = b.getGymClass().getEndsAt();
                    // Two intervals [start, end) and [bStart, bEnd) overlap if start < bEnd && end > bStart
                    return start.isBefore(bEnd) && end.isAfter(bStart);
                });
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(Long memberId) {
        Instant now = Instant.now(clock);
        return bookingRepository.findAllByMemberIdWithClass(memberId)
                .stream()
                .map(b -> toResponse(b, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getClassRoster(Long classId) {
        Instant now = Instant.now(clock);
        return bookingRepository.findRosterByClassId(classId, List.of(BookingStatus.BOOKED, BookingStatus.WAITLISTED))
                .stream()
                .map(b -> toResponse(b, now))
                .toList();
    }

    public BookingResponse toResponse(Booking booking, Instant now) {
        Long queuePosition = null;
        if (booking.getStatus() == BookingStatus.WAITLISTED) {
            queuePosition = bookingRepository.findWaitlistPosition(
                    booking.getGymClass().getId(),
                    booking.getCreatedAt(),
                    booking.getId()
            );
        }

        boolean canCancel = false;
        String cancelDisabledReason = null;

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            canCancel = false;
            cancelDisabledReason = "Already cancelled";
        } else {
            Instant cutoff = booking.getGymClass().getStartsAt().minus(Duration.ofHours(2));
            if (now.isAfter(cutoff)) {
                canCancel = false;
                cancelDisabledReason = "Cancellation cutoff passed (less than 2 hours before class)";
            } else {
                canCancel = true;
            }
        }

        return new BookingResponse(
                booking.getId(),
                booking.getGymClass().getId(),
                booking.getGymClass().getTitle(),
                booking.getGymClass().getCoach(),
                booking.getGymClass().getStartsAt(),
                booking.getGymClass().getEndsAt(),
                booking.getGymClass().getDurationMinutes(),
                booking.getMember().getId(),
                booking.getMember().getName(),
                booking.getStatus(),
                queuePosition,
                booking.getCreatedAt(),
                booking.getCancelledAt(),
                canCancel,
                cancelDisabledReason
        );
    }
}
