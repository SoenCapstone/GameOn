package com.game.on.go_messaging_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableFeignClients
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
public class GoMessagingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GoMessagingServiceApplication.class, args);
    }
}
