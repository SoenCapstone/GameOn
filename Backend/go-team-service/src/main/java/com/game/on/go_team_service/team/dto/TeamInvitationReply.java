package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record TeamInvitationReply(
        @NotNull(message = "invitationId is required")
        UUID invitationId,

        @NotNull(message = "isAccepted is required")
        boolean isAccepted
) {
}
