package com.game.on.go_api_gateway;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PublicEndpoints {

    public static final String[] AUTH_WHITELIST = {
            "/api/v1/messaging/ws",
            "/api/v1/explore/league-matches",
            "/api/v1/explore/team-matches"
    };
}
