package com.game.on.go_messaging_service.websocket;

import com.game.on.go_messaging_service.auth.CallerContextHolder;
import com.game.on.go_messaging_service.exception.UnauthorizedException;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class GatewayHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        var context = CallerContextHolder.get();
        if (context == null || context.userId() == null) {
            throw new UnauthorizedException("User context missing for WebSocket handshake");
        }
        return new MessagingPrincipal(context.userId(), context.email());
    }
}
