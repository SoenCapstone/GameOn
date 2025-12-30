package com.game.on.go_messaging_service.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendMessageRequest(
        @NotNull(message = "conversationId is required") UUID conversationId,
        @NotBlank(message = "content cannot be empty") String content
) {
}
