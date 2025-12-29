package com.game.on.go_messaging_service.message.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        String senderId,
        String content,
        OffsetDateTime createdAt
) {
}
