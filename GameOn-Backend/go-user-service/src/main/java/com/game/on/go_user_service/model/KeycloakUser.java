package com.game.on.go_user_service.model;

import java.util.List;

public record KeycloakUser(
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        List<KeycloakCredential> credentials
) {}