package com.game.on.go_league_service.league_post.dto;

import com.game.on.go_league_service.league_post.model.LeaguePostScope;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LeaguePostResponse(
        UUID id,
        UUID leagueId,
        String authorUserId,
        String title,
        String body,
        LeaguePostScope scope,
        OffsetDateTime createdAt
) {}
