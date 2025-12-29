package com.game.on.go_messaging_service.auth;

import com.game.on.go_messaging_service.exception.UnauthorizedException;
import com.game.on.go_messaging_service.websocket.MessagingPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;

@Component
public class CurrentUserProvider {

    public String requireUserId() {
        return currentUserId()
                .orElseThrow(() -> new UnauthorizedException("Caller context is missing"));
    }

    public Optional<String> currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getSubject());
        }
        return Optional.empty();
    }

    public Optional<String> currentEmail() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return Optional.ofNullable(jwt.getClaimAsString("email"));
        }
        return Optional.empty();
    }

    public String requireUserId(Principal principal) {
        if (principal instanceof MessagingPrincipal mp) {
            return mp.userId();
        }
        return requireUserId();
    }
}
