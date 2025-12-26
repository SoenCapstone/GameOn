package com.game.on.go_messaging_service.client.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record RemoteTeamDetail(
        UUID id,
        String name,
        Long ownerUserId,
        boolean archived,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<RemoteTeamMember> members
) {
}
