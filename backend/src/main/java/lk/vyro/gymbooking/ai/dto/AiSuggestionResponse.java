package lk.vyro.gymbooking.ai.dto;

import java.util.List;

public record AiSuggestionResponse(
    String query,
    String mode, // "AI" or "FALLBACK"
    List<AiClassSuggestion> suggestions
) {}
