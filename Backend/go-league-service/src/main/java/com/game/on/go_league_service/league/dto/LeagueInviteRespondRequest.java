package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueInviteStatus;
import com.game.on.go_league_service.league.model.LeagueRole;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeagueInviteRespondRequest(
        @NotNull(message = "Invite id is required")
        UUID inviteId,
        @NotNull(message = "Status is required")
        LeagueInviteStatus status
) {
}


