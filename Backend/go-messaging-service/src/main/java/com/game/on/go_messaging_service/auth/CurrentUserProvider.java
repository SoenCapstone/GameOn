package com.game.on.go_messaging_service.auth;

import com.game.on.go_messaging_service.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import com.game.on.go_messaging_service.websocket.MessagingPrincipal;

import java.security.Principal;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserProvider {

    public String requireUserId() {
        return currentUserId()
                .orElseThrow(() -> new UnauthorizedException("No authenticated JWT found"));
    }

    public Optional<String> currentUserId() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .flatMap(this::extractSubject);
    }

    public Optional<String> currentEmail() {
        return Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .flatMap(authentication -> extractClaim(authentication, "email"));
    }

    private Optional<String> extractSubject(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getSubject());
        }
        return Optional.empty();
    }

    private Optional<String> extractClaim(Authentication authentication, String claimName) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getClaimAsString(claimName));
        }
        return Optional.empty();
    }

    public String requireUserId(Principal principal) {
        if (principal instanceof MessagingPrincipal mp && mp.userId() != null) {
            return mp.userId();
        }
        return requireUserId();
    }
}
