package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamInviteStatus;
import com.game.on.go_team_service.team.model.TeamRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamInviteResponse(
        UUID id,
        UUID teamId,
        String invitedByUserId,
        String inviteeUserId,
        String inviteeEmail,
        TeamInviteStatus status,
        TeamRole role,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime expiresAt,
        OffsetDateTime respondedAt
) {
}
