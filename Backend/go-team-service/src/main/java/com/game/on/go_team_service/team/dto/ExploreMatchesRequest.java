package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ExploreMatchesRequest(
        String sport,
        @NotNull Double latitude,
        @NotNull Double longitude,
        @NotNull @Positive Double rangeKm
) {
}
