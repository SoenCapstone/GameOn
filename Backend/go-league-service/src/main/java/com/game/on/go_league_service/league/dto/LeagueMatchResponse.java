package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueMatchStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueMatchResponse(
        UUID id,
        UUID leagueId,
        LeagueMatchStatus status,
        UUID homeTeamId,
        UUID awayTeamId,
        String sport,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        String matchLocation,
        boolean requiresReferee,
        String refereeUserId,
        String createdByUserId,
        String cancelledByUserId,
        String cancelReason,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
