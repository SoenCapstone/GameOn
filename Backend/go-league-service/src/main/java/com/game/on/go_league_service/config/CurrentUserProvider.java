package com.game.on.go_league_service.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Component to provide information about the currently authenticated user.
 * It retrieves the user ID from the JWT token present in the security context allowing to avoid passing user IDs
 * explicitly in service methods.
 */
@Component ("jwtCurrentUserProvider")
public class CurrentUserProvider {

    public String clerkUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new RuntimeException("No authenticated JWT found");
        }

        return jwt.getSubject();
    }
}

