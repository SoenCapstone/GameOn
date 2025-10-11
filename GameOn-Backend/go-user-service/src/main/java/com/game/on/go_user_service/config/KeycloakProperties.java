package com.game.on.go_user_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "keycloak")
@Getter
@Setter
public class KeycloakProperties {

    private String baseUrl;
    private String realm;
    private String clientId;
    private String clientSecret;

    public String getAdminUsersUrl() {
        return baseUrl + "/admin/realms/" + realm + "/users";
    }

    public String getTokenUrl() {
        return baseUrl + "/realms/" + realm + "/protocol/openid-connect/token";
    }
}
