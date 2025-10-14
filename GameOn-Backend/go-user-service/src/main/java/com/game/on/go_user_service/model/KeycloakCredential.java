package com.game.on.go_user_service.model;

public record KeycloakCredential(
        String type,
        String value,
        boolean temporary
) {}


