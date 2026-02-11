package com.game.on.go_team_service.team_post.dto;

import com.game.on.go_team_service.team_post.model.TeamPostScope;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamPostResponse(
        UUID id,
        UUID teamId,
        String authorUserId,
        String authorRole,
        String title,
        String body,
        TeamPostScope scope,
        OffsetDateTime createdAt
) {}

