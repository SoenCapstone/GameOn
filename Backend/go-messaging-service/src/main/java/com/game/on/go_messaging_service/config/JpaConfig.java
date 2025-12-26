package com.game.on.go_messaging_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;

import java.time.OffsetDateTime;
import java.time.temporal.TemporalAccessor;
import java.util.Optional;

@Configuration
public class JpaConfig {

    @Bean
    public DateTimeProvider auditingDateTimeProvider() {
        return () -> Optional.<TemporalAccessor>of(OffsetDateTime.now());
    }
}
