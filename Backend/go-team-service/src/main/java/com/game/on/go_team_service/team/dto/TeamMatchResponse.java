package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamMatchStatus;
import com.game.on.go_team_service.team.model.TeamMatchType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamMatchResponse(
        UUID id,
        TeamMatchType matchType,
        TeamMatchStatus status,
        UUID homeTeamId,
        UUID awayTeamId,
        String sport,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        LocalDate scheduledDate,
        String matchLocation,
        UUID venueId,
        boolean requiresReferee,
        String refereeUserId,
        String notes,
        String createdByUserId,
        String cancelledByUserId,
        String cancelReason,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
