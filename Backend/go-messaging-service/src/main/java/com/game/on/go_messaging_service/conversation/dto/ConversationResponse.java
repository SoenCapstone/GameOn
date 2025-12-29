package com.game.on.go_messaging_service.conversation.dto;

import com.game.on.go_messaging_service.conversation.model.ConversationType;
import com.game.on.go_messaging_service.message.dto.MessageResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ConversationResponse(
        UUID id,
        ConversationType type,
        UUID teamId,
        String name,
        boolean isEvent,
        String createdByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime lastMessageAt,
        List<ConversationParticipantResponse> participants,
        MessageResponse lastMessage
) {
}
