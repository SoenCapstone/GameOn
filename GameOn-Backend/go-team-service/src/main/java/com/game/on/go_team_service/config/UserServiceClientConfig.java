package com.game.on.go_team_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(UserServiceClientConfig.UserServiceClientProperties.class)
public class UserServiceClientConfig {

    @Bean
    public RestClient userServiceRestClient(UserServiceClientProperties properties) {
        return RestClient.builder()
                .baseUrl(properties.resolvedBaseUrl())
                .build();
    }

    @ConfigurationProperties(prefix = "user.service")
    public record UserServiceClientProperties(String baseUrl) {
        public String resolvedBaseUrl() {
            return baseUrl == null ? "http://localhost:8090" : baseUrl;
        }
    }
}
