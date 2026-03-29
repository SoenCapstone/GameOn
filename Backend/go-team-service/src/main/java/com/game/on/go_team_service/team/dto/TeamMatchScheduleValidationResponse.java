package com.game.on.go_team_service.team.dto;

import java.util.List;
import java.util.UUID;

public record TeamMatchScheduleValidationResponse(
        boolean allowed,
        String code,
        String message,
        List<UUID> conflictingTeamIds
) {
    public static TeamMatchScheduleValidationResponse allowedResult() {
        return new TeamMatchScheduleValidationResponse(true, null, null, null);
    }

    public static TeamMatchScheduleValidationResponse blockedResult(
            String code,
            String message,
            List<UUID> conflictingTeamIds
    ) {
        return new TeamMatchScheduleValidationResponse(false, code, message, conflictingTeamIds);
    }
}
