package com.game.on.go_messaging_service.client.dto;

import java.time.OffsetDateTime;

public record RemoteTeamMember(
        String userId,
        RemoteTeamMemberRole role,
        RemoteTeamMemberStatus status,
        OffsetDateTime joinedAt
) {
}
