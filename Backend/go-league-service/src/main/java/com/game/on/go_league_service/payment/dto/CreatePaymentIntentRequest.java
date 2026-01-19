package com.game.on.go_league_service.payment.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePaymentIntentRequest(

        @NotNull(message = "amount is required")
        @Min(value = 50, message = "amount must be at least 50 cents")
        Long amount,

        @NotBlank(message = "currency is required")
        @Size(min = 3, max = 3, message = "currency must be a 3-letter ISO code (e.g., cad, usd)")
        String currency,

        @NotNull(message = "leagueId is required")
        UUID leagueId,

        String description
) {}

