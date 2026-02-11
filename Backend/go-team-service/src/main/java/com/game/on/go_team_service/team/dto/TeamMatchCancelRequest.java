package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.Size;

public record TeamMatchCancelRequest(
        @Size(max = 1000, message = "reason cannot exceed 1000 characters")
        String reason
) {
}
