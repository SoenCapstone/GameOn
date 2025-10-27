package com.game.on.go_user_service.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * {@code FeignClientConfig} provides a Feign {@link RequestInterceptor} that
 * automatically forwards the current user's Keycloak access token
 * (Bearer token) on all outgoing Feign client requests.
 *
 * <p>This configuration ensures token propagation across microservices.
 * When an authenticated request arrives at this service (e.g., {@code go-user-service})
 * with a valid JWT validated by Spring Security, this interceptor extracts
 * the token from the {@link SecurityContextHolder} and attaches it as an
 * {@code Authorization} header on all Feign HTTP requests.</p>
 *
 * <p>As a result, downstream services (e.g., {@code go-team-service},
 * can validate the same token with Keycloak,
 * maintaining the caller’s identity and permissions across service boundaries.</p>
 *
 * <p>Example of the propagated header:</p>
 * <pre>
 * Authorization: Bearer ${TOKEN_EXAMPLE}...
 * </pre>
 */
@Configuration
public class FeignClientConfig {

    @Bean
    public RequestInterceptor authForwardingInterceptor() {
        return template -> {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth instanceof JwtAuthenticationToken jwt) {
                template.header("Authorization", "Bearer " + jwt.getToken().getTokenValue());
            }
        };
    }
}
