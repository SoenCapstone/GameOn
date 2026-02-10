package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignRefereeRequest(
        @NotBlank(message = "refereeUserId is required")
        String refereeUserId
) {
}
