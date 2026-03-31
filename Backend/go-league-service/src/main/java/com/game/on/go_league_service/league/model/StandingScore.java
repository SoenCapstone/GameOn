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
    private String teamName;
    private int played;
    private int wins;
    private int draws;
    private int losses;
    private int goalsFor;
    private int goalsAgainst;
    private int points;
    private String logoUrl;

    public StandingScore(UUID teamId, String teamName, String logoUrl) {
        this.teamName = teamName;
        this.teamId = teamId;
        this.logoUrl = logoUrl;
    }

    public int getGoalDifference() {
        return goalsFor - goalsAgainst;
    }
}
