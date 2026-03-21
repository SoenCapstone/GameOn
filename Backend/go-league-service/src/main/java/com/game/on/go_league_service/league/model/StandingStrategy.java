package com.game.on.go_league_service.league.model;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface StandingStrategy {
    List<StandingScore> calculateStanding(List<UUID> teamIds, List<LeagueMatch> matches, Map<UUID, LeagueMatchScore> scoresByMatchId);
}
