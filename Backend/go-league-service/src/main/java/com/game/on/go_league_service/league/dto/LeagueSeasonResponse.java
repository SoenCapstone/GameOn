package com.game.on.go_league_service.league.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueSeasonResponse(
        UUID id,
        UUID leagueId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        OffsetDateTime createdAt,
        OffsetDateTime archivedAt
) {
}
