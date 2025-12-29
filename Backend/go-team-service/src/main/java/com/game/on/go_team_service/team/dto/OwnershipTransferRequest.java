package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record OwnershipTransferRequest(
        @NotNull(message = "teamId is required")
        UUID teamId,

        @NotNull(message = "newOwnerUserId is required")
        @Positive(message = "newOwnerUserId must be positive")
        String newOwnerUserId
) {
}
