package com.game.on.go_user_service.model;

import java.time.OffsetDateTime;
import java.util.Map;

public record ErrorResponse(
        String error,
        String message,
        Map<String, String> errors,
        OffsetDateTime timestamp
) {
    public static ErrorResponse of(String error, String message) {
        return new ErrorResponse(error, message, null, OffsetDateTime.now());
    }

    public static ErrorResponse ofValidation(Map<String, String> errors) {
        return new ErrorResponse(null, null, errors, OffsetDateTime.now());
    }
}
