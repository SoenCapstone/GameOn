package com.game.on.go_league_service.league_post.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LeaguePostScope {
    MEMBERS("Members"),
    EVERYONE("Everyone");

    private final String apiValue;

    LeaguePostScope(String apiValue) { this.apiValue = apiValue; }

    @JsonValue
    public String getApiValue() { return apiValue; }

    @JsonCreator
    public static LeaguePostScope from(String value) {
        if (value == null) return null;
        String v = value.trim();
        for (LeaguePostScope s : values()) {
            if (s.apiValue.equalsIgnoreCase(v) || s.name().equalsIgnoreCase(v)) return s;
        }
        throw new IllegalArgumentException("Invalid scope: " + value + ". Allowed: Members, Everyone");
    }
}