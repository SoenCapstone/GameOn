package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Positive;

import java.time.OffsetDateTime;

public record TeamInviteCreateRequest(
        @Positive(message = "inviteeUserId must be positive")
        Long inviteeUserId,
        @Email(message = "inviteeEmail must be a valid email")
        String inviteeEmail,
        @Future(message = "expiresAt must be in the future")
        OffsetDateTime expiresAt
) {
}
