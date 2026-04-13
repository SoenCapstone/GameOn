package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueOrganizerResponse(
        UUID id,
        UUID leagueId,
        String userId,
        OffsetDateTime joinedAt
) {}