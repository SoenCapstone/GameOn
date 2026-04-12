package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotBlank;

public record LeagueOrganizerInviteCreateRequest(
        @NotBlank String inviteeUserId
) {}