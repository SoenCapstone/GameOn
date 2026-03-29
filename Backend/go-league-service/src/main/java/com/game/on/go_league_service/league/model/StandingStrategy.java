package com.game.on.go_league_service.league.model;

import com.game.on.go_league_service.client.dto.TeamSummaryResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface StandingStrategy {
    List<StandingScore> calculateStanding(List<TeamSummaryResponse> teams, List<LeagueMatch> matches, Map<UUID, LeagueMatchScore> scoresByMatchId);
}
