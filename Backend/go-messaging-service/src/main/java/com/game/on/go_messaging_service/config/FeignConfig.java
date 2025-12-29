package com.game.on.go_messaging_service.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor authForwardingInterceptor() {
        return template -> {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletAttributes) {
                var authHeader = servletAttributes.getRequest().getHeader("Authorization");
                if (StringUtils.hasText(authHeader)) {
                    template.header("Authorization", authHeader);
                }
            }
        };
    }
}
