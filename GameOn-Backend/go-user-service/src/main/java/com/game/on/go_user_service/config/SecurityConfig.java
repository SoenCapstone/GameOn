package com.game.on.go_user_service.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configures security for the application.
 *
 * <p>This class sets up Spring Security to:
 * <ul>
 *   <li>Allow unauthenticated access to {@code /actuator/health}.</li>
 *   <li>Require authentication for all other endpoints.</li>
 *   <li>Enable JWT-based authentication with Keycloak as the OAuth2 provider.</li>
 *   <li>Allow method-level security using {@code @PreAuthorize} and similar annotations.</li>
 * </ul>
 * </p>
 *
 * <p>Place this class in the {@code config} package so Spring can automatically
 * detect and apply it at startup.</p>
 */
@Slf4j
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                        oauth2.jwt(Customizer.withDefaults())
                );

        return http.build();
    }
}
