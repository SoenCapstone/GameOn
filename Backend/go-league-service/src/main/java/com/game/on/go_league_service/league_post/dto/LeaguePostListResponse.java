package com.game.on.go_league_service.league_post.dto;

import java.util.List;

public record LeaguePostListResponse(
        List<LeaguePostResponse> items,
        long total,
        int page,
        int size,
        boolean hasNext
) {}
