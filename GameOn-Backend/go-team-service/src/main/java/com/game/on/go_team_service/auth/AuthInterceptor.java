package com.game.on.go_team_service.auth;

import com.game.on.go_team_service.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

public class AuthInterceptor implements HandlerInterceptor {

    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String USER_EMAIL_HEADER = "X-User-Email";
    private static final Set<String> EXCLUDED_PATHS = Set.of("/actuator");

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        var requestUri = request.getRequestURI();
        if (EXCLUDED_PATHS.stream().anyMatch(requestUri::startsWith)) {
            return true;
        }

        var userIdHeader = request.getHeader(USER_ID_HEADER);
        if (!StringUtils.hasText(userIdHeader)) {
            throw new UnauthorizedException("Missing " + USER_ID_HEADER + " header");
        }

        try {
            var userId = Long.parseLong(userIdHeader.trim());
            var email = request.getHeader(USER_EMAIL_HEADER);
            RequestContextHolder.set(new RequestContext(userId, email));
            return true;
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Invalid " + USER_ID_HEADER + " header");
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        RequestContextHolder.clear();
    }
}
