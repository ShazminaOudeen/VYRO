package lk.vyro.gymbooking.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lk.vyro.gymbooking.ai.dto.AiSuggestionRequest;
import lk.vyro.gymbooking.ai.dto.AiSuggestionResponse;
import lk.vyro.gymbooking.booking.BookingRepository;
import lk.vyro.gymbooking.booking.BookingService;
import lk.vyro.gymbooking.gymclass.GymClassService;
import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;
import lk.vyro.gymbooking.testutil.MutableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private GymClassService gymClassService;

    @Mock
    private BookingService bookingService;

    @Mock
    private BookingRepository bookingRepository;

    private MutableClock clock;
    private AiService aiService;

    @BeforeEach
    void setUp() {
        clock = MutableClock.at("2026-10-15T08:00:00Z");
        aiService = new AiService(
                gymClassService,
                bookingService,
                bookingRepository,
                new ObjectMapper(),
                clock
        );
    }

    @Test
    @DisplayName("Fallback engine matches 'relaxing yoga' and returns top ranked yoga class")
    void getSuggestions_fallbackMode_matchesKeywords() {
        GymClassResponse yoga = new GymClassResponse(
                1L, "Morning Vinyasa Yoga", "Elena Rostova",
                Instant.parse("2026-10-16T09:00:00Z"), Instant.parse("2026-10-16T10:00:00Z"),
                60, 20, 5, 15, 0, false
        );
        GymClassResponse hiit = new GymClassResponse(
                2L, "Extreme HIIT Inferno", "Marcus Vance",
                Instant.parse("2026-10-16T17:00:00Z"), Instant.parse("2026-10-16T17:45:00Z"),
                45, 15, 10, 5, 0, false
        );

        when(gymClassService.getScheduleNext7Days()).thenReturn(List.of(yoga, hiit));

        AiSuggestionResponse response = aiService.getSuggestions(
                new AiSuggestionRequest("Looking for a relaxing yoga session", null)
        );

        assertThat(response.mode()).isEqualTo("FALLBACK");
        assertThat(response.suggestions()).isNotEmpty();
        assertThat(response.suggestions().get(0).classId()).isEqualTo(1L);
       assertThat(response.suggestions().get(0).reason()).containsIgnoringCase("relaxation");
    }

    @Test
    @DisplayName("Filters out classes that member already has active booking for")
    void getSuggestions_filtersAlreadyBookedClasses() {
        GymClassResponse yoga = new GymClassResponse(
                1L, "Morning Vinyasa Yoga", "Elena Rostova",
                Instant.parse("2026-10-16T09:00:00Z"), Instant.parse("2026-10-16T10:00:00Z"),
                60, 20, 5, 15, 0, false
        );
        GymClassResponse pilates = new GymClassResponse(
                2L, "Core Pilates Sculpt", "Elena Rostova",
                Instant.parse("2026-10-17T09:00:00Z"), Instant.parse("2026-10-17T10:00:00Z"),
                60, 15, 2, 13, 0, false
        );

        when(gymClassService.getScheduleNext7Days()).thenReturn(List.of(yoga, pilates));
        // Member 100 has already booked yoga (classId 1)
        when(bookingRepository.existsByGymClassIdAndMemberIdAndStatusIn(eq(1L), eq(100L), any())).thenReturn(true);
        when(bookingRepository.existsByGymClassIdAndMemberIdAndStatusIn(eq(2L), eq(100L), any())).thenReturn(false);
        when(bookingService.hasOverlappingBooking(eq(100L), any(), any(), eq(2L))).thenReturn(false);

        AiSuggestionResponse response = aiService.getSuggestions(
                new AiSuggestionRequest("relaxing stretch", 100L)
        );

        assertThat(response.suggestions()).extracting(s -> s.classId()).doesNotContain(1L);
        assertThat(response.suggestions()).extracting(s -> s.classId()).contains(2L);
    }

    @Test
    @DisplayName("Returns empty suggestions cleanly when no future candidates match")
    void getSuggestions_whenNoCandidateClasses_returnsEmptyFallback() {
        when(gymClassService.getScheduleNext7Days()).thenReturn(List.of());

        AiSuggestionResponse response = aiService.getSuggestions(
                new AiSuggestionRequest("boxing workout", null)
        );

        assertThat(response.mode()).isEqualTo("FALLBACK");
        assertThat(response.suggestions()).isEmpty();
    }
}
