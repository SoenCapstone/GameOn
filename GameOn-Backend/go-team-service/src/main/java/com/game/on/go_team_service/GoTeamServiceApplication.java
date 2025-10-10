package com.game.on.go_team_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
public class GoTeamServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GoTeamServiceApplication.class, args);
    }
}
