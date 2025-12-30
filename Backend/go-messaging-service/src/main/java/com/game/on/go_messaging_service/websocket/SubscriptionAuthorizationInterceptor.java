package com.game.on.go_messaging_service.websocket;

import com.game.on.go_messaging_service.conversation.service.ConversationService;
import com.game.on.go_messaging_service.exception.ForbiddenException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SubscriptionAuthorizationInterceptor implements ChannelInterceptor {

    private final ConversationService conversationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var accessor = StompHeaderAccessor.wrap(message);
        var command = accessor.getCommand();
        if (command == null) {
            return message;
        }
        if (command == StompCommand.SUBSCRIBE) {
            enforceSubscriptionRules(accessor);
        }
        return message;
    }

    private void enforceSubscriptionRules(StompHeaderAccessor accessor) {
        var destination = accessor.getDestination();
        if (destination == null) {
            throw new ForbiddenException("Subscription destination is required");
        }
        var principal = accessor.getUser();
        if (!(principal instanceof MessagingPrincipal mp) || mp.userId() == null) {
            throw new ForbiddenException("User context not found for subscription");
        }
        if (destination.startsWith("/user/")) {
            var expectedPrefix = "/user/" + mp.userId();
            if (!destination.startsWith(expectedPrefix)) {
                throw new ForbiddenException("Cannot subscribe to another user's queue");
            }
        }
        if (destination.startsWith("/topic/chatrooms/")) {
            var idPart = destination.substring("/topic/chatrooms/".length());
            try {
                var conversationId = UUID.fromString(idPart);
                conversationService.requireParticipant(conversationId, mp.userId());
            } catch (IllegalArgumentException ex) {
                throw new ForbiddenException("Invalid chatroom destination");
            }
        }
    }
}
