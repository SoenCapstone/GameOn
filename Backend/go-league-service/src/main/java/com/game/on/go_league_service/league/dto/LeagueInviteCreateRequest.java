package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueRole;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueInviteCreateRequest(

        @NotNull(message = "League ID is required")
        UUID leagueId,

        @NotNull(message = "Invitee user ID is required")
        String inviteeUserId,

        @NotNull(message = "League role is required")
        LeagueRole role,

        @Future(message = "expiresAt must be in the future")
        OffsetDateTime expiresAt
) {
}
