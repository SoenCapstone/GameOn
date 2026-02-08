package com.game.on.go_team_service.team_post.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TeamPostScope {
    MEMBERS("Members"),
    EVERYONE("Everyone");

    private final String apiValue;

    TeamPostScope(String apiValue) { this.apiValue = apiValue; }

    @JsonValue
    public String getApiValue() { return apiValue; }

    @JsonCreator
    public static TeamPostScope from(String value) {
        if (value == null) return null;
        String v = value.trim();
        for (TeamPostScope s : values()) {
            if (s.apiValue.equalsIgnoreCase(v) || s.name().equalsIgnoreCase(v)) return s;
        }
        throw new IllegalArgumentException("Invalid scope: " + value + ". Allowed: Members, Everyone");
    }
}
