package com.game.on.go_user_service.exception;

public class KeycloakUserCreationException extends RuntimeException{
    public KeycloakUserCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}
