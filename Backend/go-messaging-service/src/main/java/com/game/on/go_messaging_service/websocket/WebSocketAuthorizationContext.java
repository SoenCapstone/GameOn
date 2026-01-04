package com.game.on.go_messaging_service.websocket;

import org.springframework.stereotype.Component;

@Component
public class WebSocketAuthorizationContext {

    private final ThreadLocal<String> bearerToken = new ThreadLocal<>();

    public void setBearerToken(String token) {
        if (token == null || token.isBlank()) {
            bearerToken.remove();
        } else {
            bearerToken.set(token);
        }
    }

    public String currentToken() {
        return bearerToken.get();
    }

    public void clear() {
        bearerToken.remove();
    }
}
