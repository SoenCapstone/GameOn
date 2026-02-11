package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.Size;

public record LeagueMatchCancelRequest(
        @Size(max = 1000, message = "reason cannot exceed 1000 characters")
        String reason
) {
}
