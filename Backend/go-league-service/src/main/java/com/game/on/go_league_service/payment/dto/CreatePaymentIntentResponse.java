package com.game.on.go_league_service.payment.dto;

import com.game.on.go_league_service.payment.model.PaymentStatus;

import java.util.UUID;

public record CreatePaymentIntentResponse(
        UUID paymentId,
        String stripePaymentIntentId,
        String clientSecret,
        Long amount,
        String currency,
        PaymentStatus status
) {}
