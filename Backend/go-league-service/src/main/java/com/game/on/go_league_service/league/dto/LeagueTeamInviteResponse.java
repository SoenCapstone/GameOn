package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueTeamInviteStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueTeamInviteResponse(
        UUID id,
        UUID leagueId,
        UUID teamId,
        String invitedByUserId,
        LeagueTeamInviteStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime respondedAt
) {
}
