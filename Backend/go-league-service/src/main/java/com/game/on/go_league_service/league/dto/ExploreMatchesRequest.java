package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ExploreMatchesRequest(
        String sport,
        @NotNull Double latitude,
        @NotNull Double longitude,
        @NotNull @Positive Double rangeKm
) {
}
