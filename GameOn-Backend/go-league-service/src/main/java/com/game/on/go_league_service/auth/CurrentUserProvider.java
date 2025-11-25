package com.game.on.go_league_service.auth;

import com.game.on.go_league_service.exception.UnauthorizedException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CurrentUserProvider {

    public Long requireUserId() {
        var context = RequestContextHolder.get();
        if (context == null) {
            throw new UnauthorizedException("Caller context is missing");
        }
        return context.userId();
    }

    public Optional<String> currentEmail() {
        var context = RequestContextHolder.get();
        return context == null ? Optional.empty() : Optional.ofNullable(context.email());
    }
}
