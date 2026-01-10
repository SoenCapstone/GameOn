package com.game.on.go_messaging_service.client;

import com.game.on.go_messaging_service.websocket.WebSocketAuthorizationContext;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamDirectoryAuthForwardingInterceptor implements RequestInterceptor {

    private final WebSocketAuthorizationContext webSocketAuthorizationContext;

    @Override
    public void apply(RequestTemplate template) {
        var token = resolveJwtToken();
        if (token == null || token.isBlank()) {
            token = webSocketAuthorizationContext.currentToken();
        }
        if (token != null && !token.isBlank()) {
            template.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
            if (log.isTraceEnabled()) {
                log.trace("Forwarded Authorization header to {}", template.feignTarget().name());
            }
        } else if (log.isDebugEnabled()) {
            log.debug("Missing Authorization token for Feign request to {}", template.feignTarget().name());
        }
    }

    private String resolveJwtToken() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            return jwt.getTokenValue();
        }
        return null;
    }
}
