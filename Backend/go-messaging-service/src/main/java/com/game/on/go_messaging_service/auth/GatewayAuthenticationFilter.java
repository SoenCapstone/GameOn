package com.game.on.go_messaging_service.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class GatewayAuthenticationFilter extends OncePerRequestFilter {

    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String USER_EMAIL_HEADER = "X-User-Email";
    private static final Set<String> EXCLUDED_PATHS = Set.of(
            "/actuator/health",
            "/v3/api-docs/**",
            "/swagger-ui/**"
    );

    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        var path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return EXCLUDED_PATHS.stream().anyMatch(pattern -> antPathMatcher.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            var userIdHeader = request.getHeader(USER_ID_HEADER);
            if (!StringUtils.hasText(userIdHeader)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing " + USER_ID_HEADER + " header");
                return;
            }
            Long userId;
            try {
                userId = Long.parseLong(userIdHeader.trim());
            } catch (NumberFormatException ex) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid " + USER_ID_HEADER + " header");
                return;
            }
            var email = request.getHeader(USER_EMAIL_HEADER);
            CallerContextHolder.set(new CallerContext(userId, email));
            filterChain.doFilter(request, response);
        } finally {
            CallerContextHolder.clear();
        }
    }
}
