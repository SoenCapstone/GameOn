package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record LeagueTeamInviteCreateRequest(
        @NotNull(message = "teamId is required")
        UUID teamId
) {
}
