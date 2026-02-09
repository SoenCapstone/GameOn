package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.RefInviteStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RefInviteResponse(
        UUID id,
        UUID matchId,
        String refereeUserId,
        String invitedByUserId,
        RefInviteStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime respondedAt
) {
}
