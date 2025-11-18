package com.game.on.go_league_service.exception;

import java.time.OffsetDateTime;

public record ErrorResponse(
        String error,
        String message,
        OffsetDateTime timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, OffsetDateTime.now());
    }
}
