package com.game.on.go_messaging_service.auth;

import com.game.on.go_messaging_service.exception.UnauthorizedException;
import com.game.on.go_messaging_service.websocket.MessagingPrincipal;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;

@Component
public class CurrentUserProvider {

    public Long requireUserId() {
        return currentUserId()
                .orElseThrow(() -> new UnauthorizedException("Caller context is missing"));
    }

    public Optional<Long> currentUserId() {
        var context = CallerContextHolder.get();
        return context == null ? Optional.empty() : Optional.ofNullable(context.userId());
    }

    public Optional<String> currentEmail() {
        var context = CallerContextHolder.get();
        return context == null ? Optional.empty() : Optional.ofNullable(context.email());
    }

    public Long requireUserId(Principal principal) {
        if (principal instanceof MessagingPrincipal mp) {
            return mp.userId();
        }
        if (principal != null) {
            try {
                return Long.parseLong(principal.getName());
            } catch (NumberFormatException ignored) {
            }
        }
        return requireUserId();
    }

    public Optional<CallerContext> currentContext() {
        return Optional.ofNullable(CallerContextHolder.get());
    }
}
