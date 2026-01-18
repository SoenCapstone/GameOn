package com.game.on.common.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/* TO DO: Remove/ update once Payment/ stripe is implemented */
public record PaymentDTO(
        UUID paymentId,
        UUID userId,
        UUID orderId,
        BigDecimal amount,
        String currency,
        String status,
        LocalDateTime createdAt
) {
}
