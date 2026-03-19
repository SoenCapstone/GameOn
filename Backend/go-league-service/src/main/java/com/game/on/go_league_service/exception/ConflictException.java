package com.game.on.go_league_service.exception;

public class ConflictException extends RuntimeException {
    private final String code;

    public ConflictException(String message) {
        this(null, message);
    }

    public ConflictException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
