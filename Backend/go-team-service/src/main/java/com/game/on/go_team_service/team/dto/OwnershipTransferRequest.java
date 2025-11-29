package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record OwnershipTransferRequest(
        @NotNull(message = "newOwnerUserId is required")
        @Positive(message = "newOwnerUserId must be positive")
        Long newOwnerUserId
) {
}
