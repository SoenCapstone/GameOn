package com.game.on.go_league_service.league.dto;

import java.util.List;

public record LeagueListResponse(
        List<LeagueSummaryResponse> items,
        long totalElements,
        int page,
        int size,
        boolean hasNext
) {
}
