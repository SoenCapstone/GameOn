package com.game.on.go_league_service.client.dto;

import java.util.UUID;

public record TeamPostCreateRequest(
        String title,
        UUID teamId,
        String body,
        String scope
) {
}
