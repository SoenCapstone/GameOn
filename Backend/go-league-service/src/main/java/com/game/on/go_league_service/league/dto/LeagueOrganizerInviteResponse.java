package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueOrganizerInviteResponse(
        UUID id,
        UUID leagueId,
        String inviteeUserId,
        String invitedByUserId,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime respondedAt
) {}