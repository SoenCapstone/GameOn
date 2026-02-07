package com.game.on.go_team_service.team_announcement.dto;

import com.game.on.go_team_service.team_announcement.model.TeamAnnouncementScope;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamAnnouncementResponse(
        UUID id,
        UUID teamId,
        String authorUserId,
        String title,
        String content,
        TeamAnnouncementScope scope,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
