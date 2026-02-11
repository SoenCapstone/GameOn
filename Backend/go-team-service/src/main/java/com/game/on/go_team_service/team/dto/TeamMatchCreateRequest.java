package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamMatchCreateRequest(
        @NotNull(message = "homeTeamId is required")
        UUID homeTeamId,
        @NotNull(message = "awayTeamId is required")
        UUID awayTeamId,
        @Size(max = 75, message = "sport cannot exceed 75 characters")
        String sport,
        @NotNull(message = "startTime is required")
        OffsetDateTime startTime,
        @NotNull(message = "endTime is required")
        OffsetDateTime endTime,
        @Size(max = 255, message = "matchRegion cannot exceed 255 characters")
        String matchRegion,
        @NotNull(message = "requiresReferee is required")
        Boolean requiresReferee,
        @Size(max = 1000, message = "notes cannot exceed 1000 characters")
        String notes
) {
}
