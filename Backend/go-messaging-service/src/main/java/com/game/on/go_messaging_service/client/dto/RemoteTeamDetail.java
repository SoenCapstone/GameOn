package com.game.on.go_messaging_service.client.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RemoteTeamDetail(
        UUID id,
        String name,
        String ownerUserId,
        boolean archived,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
