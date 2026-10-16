package lk.vyro.gymbooking.ai.dto;

import lk.vyro.gymbooking.gymclass.dto.GymClassResponse;

public record AiClassSuggestion(
    Long classId,
    GymClassResponse gymClass,
    String reason
) {}
