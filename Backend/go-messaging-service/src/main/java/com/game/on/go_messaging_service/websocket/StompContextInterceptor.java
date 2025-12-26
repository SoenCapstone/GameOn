package com.game.on.go_messaging_service.websocket;

import com.game.on.go_messaging_service.auth.CallerContext;
import com.game.on.go_messaging_service.auth.CallerContextHolder;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

@Component
public class StompContextInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var accessor = StompHeaderAccessor.wrap(message);
        if (accessor.getCommand() == StompCommand.DISCONNECT) {
            CallerContextHolder.clear();
            return message;
        }
        if (accessor.getUser() instanceof MessagingPrincipal principal) {
            CallerContextHolder.set(new CallerContext(principal.userId(), principal.email()));
        }
        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        CallerContextHolder.clear();
    }
}
