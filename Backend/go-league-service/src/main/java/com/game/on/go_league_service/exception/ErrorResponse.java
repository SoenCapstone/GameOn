package com.game.on.go_league_service.exception;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ErrorResponse(
        String error,
        String code,
        String message,
        List<UUID> conflictingTeamIds,
        OffsetDateTime timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, null, message, null, OffsetDateTime.now());
    }

    public static ErrorResponse of(String error, String code, String message) {
        return new ErrorResponse(error, code, message, null, OffsetDateTime.now());
    }

    public static ErrorResponse of(
            String error,
            String code,
            String message,
            List<UUID> conflictingTeamIds
    ) {
        return new ErrorResponse(error, code, message, conflictingTeamIds, OffsetDateTime.now());
    }
}
