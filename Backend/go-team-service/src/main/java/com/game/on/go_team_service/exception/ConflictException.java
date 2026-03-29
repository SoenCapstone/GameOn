package com.game.on.go_team_service.exception;

import java.util.List;
import java.util.UUID;

public class ConflictException extends RuntimeException {
    private final String code;
    private final List<UUID> conflictingTeamIds;

    public ConflictException(String message) {
        this(null, message, null);
    }

    public ConflictException(String code, String message) {
        this(code, message, null);
    }

    public ConflictException(String code, String message, List<UUID> conflictingTeamIds) {
        super(message);
        this.code = code;
        this.conflictingTeamIds = conflictingTeamIds;
    }

    public String getCode() {
        return code;
    }

    public List<UUID> getConflictingTeamIds() {
        return conflictingTeamIds;
    }
}
