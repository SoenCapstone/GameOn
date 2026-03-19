package com.game.on.go_team_service.exception;

import java.time.OffsetDateTime;

public record ErrorResponse(
        String error,
        String code,
        String message,
        OffsetDateTime timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, null, message, OffsetDateTime.now());
    }

    public static ErrorResponse of(String error, String code, String message) {
        return new ErrorResponse(error, code, message, OffsetDateTime.now());
    }
}
