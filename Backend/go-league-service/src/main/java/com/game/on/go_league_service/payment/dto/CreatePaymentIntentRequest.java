package com.game.on.go_league_service.payment.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record CreatePaymentIntentRequest(

        @NotNull(message = "amount is required")
        @Min(value = 50, message = "amount must be at least 50 cents")
        Long amount,

        @NotBlank(message = "currency is required")
        @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code (e.g., cad, usd)")
        String currency,

        UUID leagueId,

        UUID teamId,

        String description
) {
    @AssertTrue(message = "Exactly one of leagueId or teamId must be provided")
    public boolean isExactlyOneTargetProvided() {
        return (leagueId != null) ^ (teamId != null);
    }
}

