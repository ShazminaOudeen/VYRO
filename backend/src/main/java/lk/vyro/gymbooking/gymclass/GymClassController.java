package lk.vyro.gymbooking.gymclass;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lk.vyro.gymbooking.booking.BookingService;
import lk.vyro.gymbooking.booking.dto.BookingResponse;
import lk.vyro.gymbooking.common.ApiError;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import lk.vyro.gymbooking.common.NotFoundException;
import lk.vyro.gymbooking.gymclass.dto.CreateClassRequest;
import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;
import lk.vyro.gymbooking.user.AppUser;
import lk.vyro.gymbooking.user.Role;
import lk.vyro.gymbooking.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Gym Classes", description = "Operations for viewing class schedules, creating classes, and viewing rosters")
@RestController
@RequestMapping("/api/classes")
public class GymClassController {

    private final GymClassService gymClassService;
    private final BookingService bookingService;
    private final UserRepository userRepository;

    public GymClassController(GymClassService gymClassService,
                              BookingService bookingService,
                              UserRepository userRepository) {
        this.gymClassService = gymClassService;
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Get upcoming 7-day schedule", description = "Returns classes starting within the next 7 days, including remaining seats, waitlist count, and clash preview.")
    @ApiResponse(responseCode = "200", description = "List of upcoming gym classes")
    @GetMapping
    public ResponseEntity<List<GymClassResponse>> getSchedule(
            @Parameter(description = "Optional ID of member to evaluate schedule clashes")
            @RequestParam(value = "memberId", required = false) Long memberId) {
        return ResponseEntity.ok(gymClassService.getScheduleNext7Days(memberId));
    }

    @Operation(summary = "Get class by ID", description = "Returns a single class by its primary key.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Class details"),
            @ApiResponse(responseCode = "404", description = "Class not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<GymClassResponse> getClassById(
            @Parameter(description = "Class ID") @PathVariable Long id) {
        return ResponseEntity.ok(gymClassService.getClassById(id));
    }

    @Operation(summary = "Create gym class (Staff only)", description = "Staff creates a new gym class. Enforces Rule 7 validations.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Class created successfully",
                    content = @Content(schema = @Schema(implementation = GymClassResponse.class))),
            @ApiResponse(responseCode = "400", description = "Validation error: invalid duration, capacity, or past time",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Acting user not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Access denied: acting user is not a staff member",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping
    public ResponseEntity<GymClassResponse> createClass(
            @Parameter(description = "ID of the acting staff user from user switcher") @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @Valid @RequestBody CreateClassRequest request) {

        if (userId == null) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "X-User-Id header is required to verify staff permissions");
        }

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + userId));

        if (user.getRole() != Role.STAFF) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Only staff users can create classes");
        }

        GymClassResponse response = gymClassService.createClass(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get class roster (Staff)", description = "Returns seated members (BOOKED) and waitlisted members in deterministic FIFO queue order.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Class roster list"),
            @ApiResponse(responseCode = "404", description = "Class not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @GetMapping("/{id}/roster")
    public ResponseEntity<List<BookingResponse>> getClassRoster(
            @Parameter(description = "Class ID") @PathVariable Long id) {
        // Ensure class exists
        gymClassService.getClassById(id);
        return ResponseEntity.ok(bookingService.getClassRoster(id));
    }
}
