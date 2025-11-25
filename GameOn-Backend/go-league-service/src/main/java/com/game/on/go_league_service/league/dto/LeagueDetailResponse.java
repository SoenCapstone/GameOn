package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueDetailResponse(
        UUID id,
        String name,
        String sport,
        String slug,
        String location,
        String region,
        Long ownerUserId,
        LeagueLevel level,
        LeaguePrivacy privacy,
        long seasonCount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime archivedAt
) {
}
