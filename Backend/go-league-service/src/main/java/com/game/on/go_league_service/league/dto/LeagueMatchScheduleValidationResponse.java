package com.game.on.go_league_service.league.dto;

public record LeagueMatchScheduleValidationResponse(
        boolean allowed,
        String code,
        String message
) {
    public static LeagueMatchScheduleValidationResponse allowedResult() {
        return new LeagueMatchScheduleValidationResponse(true, null, null);
    }

    public static LeagueMatchScheduleValidationResponse blockedResult(String code, String message) {
        return new LeagueMatchScheduleValidationResponse(false, code, message);
    }
}
