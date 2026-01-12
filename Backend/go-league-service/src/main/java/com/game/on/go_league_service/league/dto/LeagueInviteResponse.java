package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import com.game.on.go_league_service.league.model.LeagueInviteStatus;

public record LeagueInviteResponse(
        UUID inviteId,
        UUID leagueId,
        String inviteeEmail,
        LeagueInviteStatus status,
        OffsetDateTime expiresAt,
        OffsetDateTime createdAt
) {}