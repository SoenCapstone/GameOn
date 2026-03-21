package com.game.on.go_league_service.league.dto;

import java.util.List;
import java.util.UUID;

public record LeagueMatchScheduleValidationResponse(
        boolean allowed,
        String code,
        String message,
        List<UUID> conflictingTeamIds
) {
    public static LeagueMatchScheduleValidationResponse allowedResult() {
        return new LeagueMatchScheduleValidationResponse(true, null, null, null);
    }

    public static LeagueMatchScheduleValidationResponse blockedResult(
            String code,
            String message,
            List<UUID> conflictingTeamIds
    ) {
        return new LeagueMatchScheduleValidationResponse(false, code, message, conflictingTeamIds);
    }
}
