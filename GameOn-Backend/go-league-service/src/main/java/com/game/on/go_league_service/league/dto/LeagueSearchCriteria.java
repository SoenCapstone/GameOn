package com.game.on.go_league_service.league.dto;

public record LeagueSearchCriteria(
        boolean onlyMine,
        String sport,
        String region,
        String query
) {
}
