package com.game.on.go_api_gateway;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class PublicEndpoints {

    public static final String[] AUTH_WHITELIST = {
            "/api/v1/user/create"
    };
}
