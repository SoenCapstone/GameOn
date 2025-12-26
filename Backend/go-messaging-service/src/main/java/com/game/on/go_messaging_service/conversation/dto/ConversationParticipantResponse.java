package com.game.on.go_messaging_service.conversation.dto;

import com.game.on.go_messaging_service.conversation.model.ConversationParticipantRole;

import java.time.OffsetDateTime;

public record ConversationParticipantResponse(
        Long userId,
        ConversationParticipantRole role,
        OffsetDateTime joinedAt
) {
}
