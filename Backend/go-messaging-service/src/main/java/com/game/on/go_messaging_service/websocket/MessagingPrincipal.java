package com.game.on.go_messaging_service.websocket;

import java.security.Principal;

public record MessagingPrincipal(String userId, String email, String bearerToken) implements Principal {
    @Override
    public String getName() {
        return userId == null ? "anonymous" : userId;
    }
}
