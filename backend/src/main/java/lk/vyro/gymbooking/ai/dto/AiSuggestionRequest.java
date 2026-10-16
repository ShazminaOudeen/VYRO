package lk.vyro.gymbooking.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AiSuggestionRequest(
    @NotBlank(message = "Query text is required")
    @Size(max = 250, message = "Query must not exceed 250 characters")
    String query,

    Long memberId
) {}
