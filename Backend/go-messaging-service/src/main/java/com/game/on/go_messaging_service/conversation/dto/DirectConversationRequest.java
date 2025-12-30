package com.game.on.go_messaging_service.conversation.dto;

import jakarta.validation.constraints.NotBlank;

public record DirectConversationRequest(@NotBlank(message = "targetUserId is required") String targetUserId) {
}
