package com.game.on.go_messaging_service.message.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID conversationId,
        Long senderId,
        String content,
        OffsetDateTime createdAt
) {
}
