package com.game.on.go_messaging_service.message.service;

import com.game.on.go_messaging_service.conversation.service.ConversationMapper;
import com.game.on.go_messaging_service.message.model.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Collection;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class MessageBroadcastGateway {

    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationMapper conversationMapper;

    public void publishToUsers(Collection<Long> userIds, Message message) {
        Runnable action = () -> userIds.forEach(userId -> messagingTemplate.convertAndSendToUser(
                Long.toString(userId),
                "/queue/messages",
                conversationMapper.toMessageResponse(message)
        ));
        runAfterCommit(action);
    }

    public void publishToConversation(UUID conversationId, Message message) {
        Runnable action = () -> messagingTemplate.convertAndSend(
                "/topic/chatrooms/" + conversationId,
                conversationMapper.toMessageResponse(message)
        );
        runAfterCommit(action);
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
