package com.game.on.go_league_service.league.model;

import lombok.Data;

import java.util.*;

@Data
public class SoccerStandingStrategy implements StandingStrategy {

    @Override
    public List<StandingScore> calculateStanding(List<UUID> teamIds, List<LeagueMatch> leagueMatches, Map<UUID, LeagueMatchScore> scoresByMatchId) {
        Map<UUID, StandingScore> standings = new HashMap<>();

        for (UUID teamId : teamIds) {
            standings.put(teamId, new StandingScore(teamId));
        }

        for (LeagueMatch match : leagueMatches) {

            LeagueMatchScore score = scoresByMatchId.get(match.getId());
            if (score == null) {
                continue;
            }

            UUID homeTeamId = match.getHomeTeamId();
            UUID awayTeamId = match.getAwayTeamId();

            StandingScore home = standings.get(homeTeamId);
            StandingScore away = standings.get(awayTeamId);

            if (home == null || away == null) {
                continue;
            }

            int homeGoals = score.getHomeScore();
            int awayGoals = score.getAwayScore();

            home.setPlayed(home.getPlayed() + 1);
            away.setPlayed(away.getPlayed() + 1);

            home.setGoalsFor(home.getGoalsFor() + homeGoals);
            home.setGoalsAgainst(home.getGoalsAgainst() + awayGoals);

            away.setGoalsFor(away.getGoalsFor() + awayGoals);
            away.setGoalsAgainst(away.getGoalsAgainst() + homeGoals);

            if (homeGoals > awayGoals) {
                home.setWins(home.getWins() + 1);
                home.setPoints(home.getPoints() + 3);
                away.setLosses(away.getLosses() + 1);
            } else if (awayGoals > homeGoals) {
                away.setWins(away.getWins() + 1);
                away.setPoints(away.getPoints() + 3);
                home.setLosses(home.getLosses() + 1);
            } else {
                home.setDraws(home.getDraws() + 1);
                away.setDraws(away.getDraws() + 1);
                home.setPoints(home.getPoints() + 1);
                away.setPoints(away.getPoints() + 1);
            }
        }

        return standings.values().stream()
                .sorted(Comparator.comparingInt(StandingScore::getPoints).reversed())
                .toList();
    }
}
