package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamInviteStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamInviteResponse(
        UUID id,
        UUID teamId,
        Long invitedByUserId,
        Long inviteeUserId,
        String inviteeEmail,
        TeamInviteStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        OffsetDateTime expiresAt,
        OffsetDateTime respondedAt
) {
}
