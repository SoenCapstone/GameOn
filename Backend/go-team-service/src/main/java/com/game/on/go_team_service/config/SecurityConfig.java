package com.game.on.go_team_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/health",
                                "/api/v1/teams/**"  // Allow unauthenticated access for testing
                        ).permitAll()
                        .anyRequest().authenticated()
                );
        
        // Only configure OAuth2 JWT if other secured endpoints exist
        // For now, all endpoints are permitAll, so JWT is not required

        return http.build();
    }
}
