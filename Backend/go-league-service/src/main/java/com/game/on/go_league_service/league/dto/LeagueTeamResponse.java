package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueTeamResponse(
        UUID id,
        UUID leagueId,
        UUID teamId,
        OffsetDateTime joinedAt
) {
}
