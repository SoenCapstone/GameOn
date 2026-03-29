package com.game.on.go_league_service.league.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class StandingScore {
    private UUID teamId;
    private int played;
    private int wins;
    private int draws;
    private int losses;
    private int goalsFor;
    private int goalsAgainst;
    private int points;

    public StandingScore(UUID teamId) {
        this.teamId = teamId;
    }

    public int getGoalDifference() {
        return Math.abs(goalsFor - goalsAgainst);
    }
}
