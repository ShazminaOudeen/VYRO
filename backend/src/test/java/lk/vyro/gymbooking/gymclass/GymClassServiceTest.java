package lk.vyro.gymbooking.gymclass;

import lk.vyro.gymbooking.booking.BookingRepository;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import lk.vyro.gymbooking.gymclass.dto.CreateClassRequest;
import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;
import lk.vyro.gymbooking.testutil.MutableClock;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GymClassServiceTest {

    @Mock
    private GymClassRepository gymClassRepository;

    @Mock
    private BookingRepository bookingRepository;

    private MutableClock clock;
    private GymClassService gymClassService;

    @BeforeEach
    void setUp() {
        clock = MutableClock.at("2026-10-15T10:00:00Z");
        gymClassService = new GymClassService(gymClassRepository, bookingRepository, clock);
    }

    @Test
    @DisplayName("Create class with past start time throws BusinessRuleException(INVALID_INPUT)")
    void createClass_withPastStartTime_throwsInvalidInput() {
        Instant past = clock.instant().minus(Duration.ofMinutes(10));
        CreateClassRequest request = new CreateClassRequest(
                "Spin Blast", "Coach Kamal", past, 45, 10
        );

        assertThatThrownBy(() -> gymClassService.createClass(request))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(ex -> {
                    BusinessRuleException bre = (BusinessRuleException) ex;
                    assertThat(bre.getErrorCode()).isEqualTo(ErrorCode.INVALID_INPUT);
                    assertThat(bre.getMessage()).contains("future");
                });

        verifyNoInteractions(gymClassRepository);
    }

    @Test
    @DisplayName("Create class with future start time saves and returns GymClassResponse")
    void createClass_withFutureStartTime_createsSuccessfully() {
        Instant future = clock.instant().plus(Duration.ofHours(2));
        CreateClassRequest request = new CreateClassRequest(
                "Spin Blast", "Coach Kamal", future, 45, 10
        );

        when(gymClassRepository.save(any(GymClass.class))).thenAnswer(invocation -> {
            GymClass c = invocation.getArgument(0);
            return new GymClass(1L, c.getTitle(), c.getCoach(), c.getStartsAt(), c.getDurationMinutes(), c.getCapacity(), clock.instant());
        });

        GymClassResponse response = gymClassService.createClass(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("Spin Blast");
        assertThat(response.capacity()).isEqualTo(10);
        assertThat(response.seatsLeft()).isEqualTo(10);
        assertThat(response.isFull()).isFalse();
        verify(gymClassRepository, times(1)).save(any(GymClass.class));
    }

    @Test
    @DisplayName("getScheduleNext7Days queries exactly within now and now + 7 days")
    void getScheduleNext7Days_queriesNext7DaysWindow() {
        Instant now = clock.instant();
        Instant end = now.plus(Duration.ofDays(7));

        when(gymClassRepository.findByStartsAtBetweenOrderByStartsAtAsc(now, end)).thenReturn(List.of());

        List<GymClassResponse> result = gymClassService.getScheduleNext7Days();

        assertThat(result).isEmpty();
        verify(gymClassRepository, times(1)).findByStartsAtBetweenOrderByStartsAtAsc(now, end);
    }
}
