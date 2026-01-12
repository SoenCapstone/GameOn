package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueInviteStatus;
import jakarta.validation.constraints.NotNull;


public record LeagueInviteRespondRequest(
        @NotNull(message = "Status is required")
        LeagueInviteStatus status
) {
}


