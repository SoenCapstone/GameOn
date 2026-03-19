package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamRole;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(
        @NotNull(message = "Role is required")
        TeamRole role
) {
}