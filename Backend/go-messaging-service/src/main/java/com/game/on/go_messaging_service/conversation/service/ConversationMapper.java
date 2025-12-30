package com.game.on.go_messaging_service.conversation.service;

import com.game.on.go_messaging_service.conversation.dto.ConversationParticipantResponse;
import com.game.on.go_messaging_service.conversation.dto.ConversationResponse;
import com.game.on.go_messaging_service.conversation.model.Conversation;
import com.game.on.go_messaging_service.conversation.model.ConversationParticipant;
import com.game.on.go_messaging_service.message.dto.MessageResponse;
import com.game.on.go_messaging_service.message.model.Message;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ConversationMapper {

    public ConversationResponse toConversationResponse(Conversation conversation,
                                                        List<ConversationParticipant> participants,
                                                        Message lastMessage) {
        List<ConversationParticipantResponse> participantResponses = participants.stream()
                .map(this::toParticipantResponse)
                .toList();
        MessageResponse lastMessageResponse = lastMessage == null ? null : toMessageResponse(lastMessage);
        return new ConversationResponse(
                conversation.getId(),
                conversation.getType(),
                conversation.getTeamId(),
                conversation.getName(),
                conversation.isEvent(),
                conversation.getCreatedByUserId(),
                conversation.getCreatedAt(),
                conversation.getLastMessageAt(),
                participantResponses,
                lastMessageResponse
        );
    }

    public ConversationParticipantResponse toParticipantResponse(ConversationParticipant participant) {
        return new ConversationParticipantResponse(
                participant.getUserId(),
                participant.getRole(),
                participant.getJoinedAt()
        );
    }

    public MessageResponse toMessageResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderId(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
