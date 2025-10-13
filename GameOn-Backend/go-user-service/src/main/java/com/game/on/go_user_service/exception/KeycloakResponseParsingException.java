package com.game.on.go_user_service.exception;

public class KeycloakResponseParsingException extends RuntimeException {
    public KeycloakResponseParsingException(String message) {
        super(message);
    }

    public KeycloakResponseParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}
