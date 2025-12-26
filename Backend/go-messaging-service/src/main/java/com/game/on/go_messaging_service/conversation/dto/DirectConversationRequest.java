package com.game.on.go_messaging_service.conversation.dto;

import jakarta.validation.constraints.NotNull;

public record DirectConversationRequest(@NotNull(message = "targetUserId is required") Long targetUserId) {
}
