package lk.vyro.gymbooking.ai;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lk.vyro.gymbooking.ai.dto.AiSuggestionRequest;
import lk.vyro.gymbooking.ai.dto.AiSuggestionResponse;
import lk.vyro.gymbooking.common.ApiError;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "AI Assistant", description = "AI-powered natural language class recommendations with Gemini 1.5 Flash and smart fallback engine")
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @Operation(
            summary = "Get AI class suggestions",
            description = "Analyzes a natural language request (e.g. 'relaxing class tomorrow evening') against upcoming available classes over the next 7 days. Returns ranked suggestions with personalized reasons. Automatically excludes classes the member already booked or has schedule conflicts with."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Suggestions generated successfully (AI or Fallback mode)",
                    content = @Content(schema = @Schema(implementation = AiSuggestionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid input (e.g. empty query or query exceeds 250 chars)",
                    content = @Content(schema = @Schema(implementation = ApiError.class))
            )
    })
    @PostMapping("/suggestions")
    public ResponseEntity<AiSuggestionResponse> getSuggestions(
            @Valid @RequestBody AiSuggestionRequest body,
            @Parameter(description = "Acting member ID from X-User-Id header")
            @RequestHeader(value = "X-User-Id", required = false) Long headerMemberId
    ) {
        Long effectiveMemberId = body.memberId() != null ? body.memberId() : headerMemberId;
        AiSuggestionRequest effectiveRequest = new AiSuggestionRequest(body.query(), effectiveMemberId);

        AiSuggestionResponse response = aiService.getSuggestions(effectiveRequest);
        return ResponseEntity.ok(response);
    }
}
