package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TeamMatchScoreRequest(
        @NotNull(message = "homeScore is required")
        @Min(value = 0, message = "homeScore must be >= 0")
        Integer homeScore,
        @NotNull(message = "awayScore is required")
        @Min(value = 0, message = "awayScore must be >= 0")
        Integer awayScore
) {
}
