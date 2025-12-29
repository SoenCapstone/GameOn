package com.game.on.go_messaging_service.message.service;

import com.game.on.go_messaging_service.conversation.model.Conversation;
import com.game.on.go_messaging_service.conversation.repository.ConversationParticipantRepository;
import com.game.on.go_messaging_service.conversation.repository.ConversationRepository;
import com.game.on.go_messaging_service.conversation.service.ConversationMapper;
import com.game.on.go_messaging_service.conversation.service.ConversationService;
import com.game.on.go_messaging_service.exception.BadRequestException;
import com.game.on.go_messaging_service.message.dto.MessageHistoryResponse;
import com.game.on.go_messaging_service.message.dto.MessageResponse;
import com.game.on.go_messaging_service.message.model.Message;
import com.game.on.go_messaging_service.message.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final int DEFAULT_LIMIT = 50;
    private static final int MAX_LIMIT = 200;
    private static final int MAX_CONTENT_LENGTH = 2000;

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final ConversationService conversationService;
    private final ConversationMapper conversationMapper;
    private final MessageRepository messageRepository;
    private final MessageBroadcastGateway broadcastGateway;

    @Transactional
    public MessageResponse sendMessage(UUID conversationId, String senderId, String content) {
        var sanitized = sanitizeContent(content);
        var conversation = conversationService.requireConversation(conversationId);
        conversationService.requireParticipant(conversationId, senderId);
        var message = Message.builder()
                .conversation(conversation)
                .senderId(senderId)
                .content(sanitized)
                .build();
        var saved = messageRepository.save(message);
        conversation.setLastMessageAt(saved.getCreatedAt());
        conversationRepository.save(conversation);
        dispatch(conversation, saved);
        return conversationMapper.toMessageResponse(saved);
    }

    @Transactional(readOnly = true)
    public MessageHistoryResponse fetchHistory(UUID conversationId,
                                               String requesterId,
                                               Integer limit,
                                               OffsetDateTime before) {
        conversationService.requireParticipant(conversationId, requesterId);
        int pageSize = sanitizeLimit(limit);
        var pageable = PageRequest.of(0, pageSize);
        var results = before == null
                ? messageRepository.findMessages(conversationId, pageable)
                : messageRepository.findMessagesBefore(conversationId, before, pageable);
        var messages = results.isEmpty() ? List.<Message>of() : new java.util.ArrayList<>(results);
        Collections.reverse(messages);
        List<MessageResponse> payload = messages.stream()
                .map(conversationMapper::toMessageResponse)
                .toList();
        boolean hasMore = results.size() == pageSize;
        return new MessageHistoryResponse(payload, hasMore);
    }

    private void dispatch(Conversation conversation, Message saved) {
        if (conversation.isDirect()) {
            var participantIds = participantRepository.findParticipantIds(conversation.getId());
            broadcastGateway.publishToUsers(participantIds, saved);
        } else {
            broadcastGateway.publishToConversation(conversation.getId(), saved);
        }
    }

    private String sanitizeContent(String content) {
        if (!StringUtils.hasText(content)) {
            throw new BadRequestException("Message content cannot be empty");
        }
        var trimmed = content.trim();
        if (trimmed.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException("Message content exceeds the maximum length");
        }
        return trimmed;
    }

    private int sanitizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
