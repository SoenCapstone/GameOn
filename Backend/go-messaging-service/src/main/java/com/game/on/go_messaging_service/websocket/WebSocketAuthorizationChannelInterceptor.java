package com.game.on.go_messaging_service.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.messaging.support.ExecutorChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketAuthorizationChannelInterceptor implements ExecutorChannelInterceptor {

    private static final String TOKEN_HEADER = "ws-auth-token";

    private final WebSocketAuthorizationContext authorizationContext;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        var token = resolveToken(accessor);
        if (token != null && !token.isBlank()) {
            authorizationContext.setBearerToken(token);
            if (accessor != null) {
                if (!accessor.isMutable()) {
                    var mutable = StompHeaderAccessor.wrap(message);
                    mutable.setHeader(TOKEN_HEADER, token);
                    return MessageBuilder.createMessage(message.getPayload(), mutable.getMessageHeaders());
                }
                accessor.setHeader(TOKEN_HEADER, token);
            }
        } else {
            authorizationContext.clear();
            if (accessor != null) {
                if (!accessor.isMutable()) {
                    var mutable = StompHeaderAccessor.wrap(message);
                    mutable.removeHeader(TOKEN_HEADER);
                    return MessageBuilder.createMessage(message.getPayload(), mutable.getMessageHeaders());
                }
                accessor.removeHeader(TOKEN_HEADER);
            }
        }
        return message;
    }

    @Override
    public Message<?> beforeHandle(Message<?> message,
                                   MessageChannel channel,
                                   org.springframework.messaging.MessageHandler handler) {
        var accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        var token = accessor == null ? null : (String) accessor.getHeader(TOKEN_HEADER);
        if (token != null && !token.isBlank()) {
            authorizationContext.setBearerToken(token);
        } else {
            authorizationContext.clear();
        }
        return message;
    }

    @Override
    public void afterMessageHandled(Message<?> message,
                                    MessageChannel channel,
                                    org.springframework.messaging.MessageHandler handler,
                                    Exception ex) {
        authorizationContext.clear();
    }

    @Override
    public void afterSendCompletion(Message<?> message,
                                    MessageChannel channel,
                                    boolean sent,
                                    Exception ex) {
        authorizationContext.clear();
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        if (accessor == null) {
            return null;
        }
        var principal = accessor.getUser();
        if (principal instanceof MessagingPrincipal mp) {
            return mp.bearerToken();
        }
        return null;
    }
}
