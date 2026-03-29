package com.game.on.go_league_service.league.model;

public class StandingStrategyFactory {

    public static StandingStrategy createStandingStrategy(String sportType) {
        switch (sportType.toLowerCase()) {
            case "soccer":
                return new SoccerStandingStrategy();

            default:
                /* Keep default as soccer for now, need to discuss default behaviour next meeting */
                return new SoccerStandingStrategy();
        }
    }
}
