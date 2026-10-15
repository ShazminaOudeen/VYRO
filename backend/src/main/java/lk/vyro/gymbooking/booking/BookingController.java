package lk.vyro.gymbooking.booking;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lk.vyro.gymbooking.booking.dto.BookingRequest;
import lk.vyro.gymbooking.booking.dto.BookingResponse;
import lk.vyro.gymbooking.common.ApiError;
import lk.vyro.gymbooking.common.BusinessRuleException;
import lk.vyro.gymbooking.common.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Bookings", description = "Operations for booking gym classes, member bookings, and cancellations")
@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Operation(summary = "Book a gym class", description = "Books a seat if available (BOOKED) or adds member to FIFO waitlist (WAITLISTED). Prevents duplicates and overlapping booked classes.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Booking created (BOOKED or WAITLISTED)",
                    content = @Content(schema = @Schema(implementation = BookingResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or only members allowed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "404", description = "Class or member not found",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Conflict: class already started, duplicate booking, or schedule overlap",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/classes/{classId}/bookings")
    public ResponseEntity<BookingResponse> bookClass(
            @Parameter(description = "ID of the gym class to book") @PathVariable Long classId,
            @Parameter(description = "ID of the acting member from user switcher") @RequestHeader(value = "X-User-Id", required = false) Long headerMemberId,
            @RequestBody(required = false) BookingRequest body) {

        Long memberId = (body != null && body.memberId() != null) ? body.memberId() : headerMemberId;
        if (memberId == null) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Member ID is required via request body or X-User-Id header");
        }

        BookingRequest request = new BookingRequest(classId, memberId);
        BookingResponse response = bookingService.bookClass(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Get personal bookings for a member", description = "Returns all upcoming and past bookings for a member, with queue positions and cancel eligibility.")
    @ApiResponse(responseCode = "200", description = "Member's booking list")
    @GetMapping("/members/{memberId}/bookings")
    public ResponseEntity<List<BookingResponse>> getMemberBookings(
            @Parameter(description = "Member ID") @PathVariable Long memberId) {
        return ResponseEntity.ok(bookingService.getMyBookings(memberId));
    }

    @Operation(summary = "Cancel a booking", description = "Cancels a booking if within the 2-hour cutoff window. Automatically promotes the next eligible waitlisted member.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Booking successfully cancelled",
                    content = @Content(schema = @Schema(implementation = BookingResponse.class))),
            @ApiResponse(responseCode = "404", description = "Booking not found or not owned by member",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @ApiResponse(responseCode = "409", description = "Cancellation cutoff passed (less than 2 hours before start)",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBookingPost(
            @Parameter(description = "Booking ID") @PathVariable Long id,
            @Parameter(description = "Member ID to verify ownership") @RequestHeader(value = "X-User-Id", required = false) Long headerMemberId,
            @RequestParam(value = "memberId", required = false) Long paramMemberId) {

        Long memberId = (headerMemberId != null) ? headerMemberId : paramMemberId;
        if (memberId == null) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Member ID is required to verify booking ownership");
        }

        return ResponseEntity.ok(bookingService.cancelBooking(id, memberId));
    }

    @Operation(summary = "Cancel a booking (DELETE alternative)", description = "DELETE method alias for booking cancellation.")
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<BookingResponse> cancelBookingDelete(
            @Parameter(description = "Booking ID") @PathVariable Long id,
            @Parameter(description = "Member ID to verify ownership") @RequestHeader(value = "X-User-Id", required = false) Long headerMemberId,
            @RequestParam(value = "memberId", required = false) Long paramMemberId) {

        Long memberId = (headerMemberId != null) ? headerMemberId : paramMemberId;
        if (memberId == null) {
            throw new BusinessRuleException(ErrorCode.INVALID_INPUT, "Member ID is required to verify booking ownership");
        }

        return ResponseEntity.ok(bookingService.cancelBooking(id, memberId));
    }
}
