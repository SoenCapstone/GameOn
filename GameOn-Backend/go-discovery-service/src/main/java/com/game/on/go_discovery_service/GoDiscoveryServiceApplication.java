package com.game.on.go_discovery_service;

import lombok.extern.log4j.Log4j2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@Log4j2
@EnableEurekaServer
public class GoDiscoveryServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(GoDiscoveryServiceApplication.class);

    public static void main(String[] args) {
		SpringApplication.run(GoDiscoveryServiceApplication.class, args);

        log.info("Information message for user");
        log.error("Error message");
	}

}
