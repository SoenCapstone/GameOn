package com.game.on.go_messaging_service.config;

import com.game.on.go_messaging_service.auth.CurrentUserProvider;
import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor userContextPropagatingInterceptor(CurrentUserProvider currentUserProvider) {
        return template -> currentUserProvider.currentContext().ifPresent(context -> {
            if (context.userId() != null) {
                template.header("X-User-Id", context.userId().toString());
            }
            if (context.email() != null) {
                template.header("X-User-Email", context.email());
            }
        });
    }
}
