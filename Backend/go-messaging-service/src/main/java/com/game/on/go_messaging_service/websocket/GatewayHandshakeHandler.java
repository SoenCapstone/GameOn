package com.game.on.go_messaging_service.websocket;

import com.game.on.go_messaging_service.exception.UnauthorizedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.Principal;
import java.util.Map;

@Component
public class GatewayHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtDecoder jwtDecoder;

    public GatewayHandshakeHandler(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    protected Principal determineUser(ServerHttpRequest request,
                                      WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        Jwt jwt = resolveJwt(request);
        var email = jwt.getClaimAsString("email");
        return new MessagingPrincipal(jwt.getSubject(), email, jwt.getTokenValue());
    }

    private Jwt resolveJwt(ServerHttpRequest request) {
        String token = extractToken(request);
        if (!StringUtils.hasText(token)) {
            throw new UnauthorizedException("User context missing for WebSocket handshake");
        }
        try {
            return jwtDecoder.decode(token);
        } catch (JwtException ex) {
            throw new UnauthorizedException("Invalid JWT for WebSocket handshake");
        }
    }

    private String extractToken(ServerHttpRequest request) {
        var headers = request.getHeaders().getOrEmpty(HttpHeaders.AUTHORIZATION);
        for (String header : headers) {
            if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
                return header.substring(7);
            }
        }
        var queryParams = UriComponentsBuilder.fromUri(request.getURI()).build().getQueryParams();
        return queryParams.getFirst("token");
    }
}
