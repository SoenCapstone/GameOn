package com.game.on.go_team_service.team.dto;

public record TeamMatchScheduleValidationResponse(
        boolean allowed,
        String code,
        String message
) {
    public static TeamMatchScheduleValidationResponse allowedResult() {
        return new TeamMatchScheduleValidationResponse(true, null, null);
    }

    public static TeamMatchScheduleValidationResponse blockedResult(String code, String message) {
        return new TeamMatchScheduleValidationResponse(false, code, message);
    }
}
