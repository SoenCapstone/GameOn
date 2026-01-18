package com.game.on.go_league_service.payment.dto;

import com.game.on.go_league_service.payment.model.PaymentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID leagueId,
        Long amount,
        String currency,
        PaymentStatus status,
        OffsetDateTime createdAt
) {}
