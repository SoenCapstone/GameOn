package com.game.on.go_messaging_service.conversation.dto;

import jakarta.validation.constraints.NotBlank;

public record TeamConversationRequest(
        @NotBlank(message = "name is required") String name,
        boolean isEvent
) {
}
