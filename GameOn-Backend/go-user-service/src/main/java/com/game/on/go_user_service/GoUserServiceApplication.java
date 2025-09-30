package com.game.on.go_user_service;

import lombok.extern.log4j.Log4j2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@Log4j2
public class GoUserServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(GoUserServiceApplication.class);

    public static void main(String[] args) {
		SpringApplication.run(GoUserServiceApplication.class, args);

        log.info("Basic information log");
        log.error("Error message");
	}

}
