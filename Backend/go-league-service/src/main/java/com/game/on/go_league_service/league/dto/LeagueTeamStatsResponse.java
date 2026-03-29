package com.game.on.go_league_service.league.dto;

import java.util.UUID;

public record LeagueTeamStatsResponse(
        UUID leagueId,
        UUID teamId,
        int points,
        int matches,
        int winStreak,
        long minutesPlayed
) {
}