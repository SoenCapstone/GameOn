package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueMatchCreateRequest(
        @NotNull(message = "homeTeamId is required")
        UUID homeTeamId,
        @NotNull(message = "awayTeamId is required")
        UUID awayTeamId,
        @NotNull(message = "startTime is required")
        OffsetDateTime startTime,
        @NotNull(message = "endTime is required")
        OffsetDateTime endTime,
        @Size(max = 255, message = "matchLocation cannot exceed 255 characters")
        String matchLocation,
        @NotNull(message = "requiresReferee is required")
        Boolean requiresReferee
) {
}
