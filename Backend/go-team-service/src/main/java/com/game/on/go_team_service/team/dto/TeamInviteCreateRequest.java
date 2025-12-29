package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamRole;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamInviteCreateRequest(
        @NotNull(message = "Team ID is required")
        UUID teamId,

        @NotNull(message = "Invitee user ID is required")
        String inviteeUserId,

        @NotNull(message = "Team role is required")
        TeamRole role,

        @Future(message = "expiresAt must be in the future")
        OffsetDateTime expiresAt
) {
}
