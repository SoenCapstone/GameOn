package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueInviteStatus;
import com.game.on.go_league_service.league.model.LeagueRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueInviteRespondRequest(
        UUID id,
        UUID leagueId,
        String invitedByUserId,
        String inviteeUserId,
        String inviteeEmail,
        LeagueInviteStatus status,
        LeagueRole role,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime expiresAt,
        OffsetDateTime respondedAt
) {
}


