package com.game.on.go_config_server;

import lombok.extern.log4j.Log4j2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@Log4j2
@EnableConfigServer
public class GoConfigServerApplication {

    private static final Logger log = LoggerFactory.getLogger(GoConfigServerApplication.class);

    public static void main(String[] args) {
		SpringApplication.run(GoConfigServerApplication.class, args);

        log.info("Basic information log");
        log.error("Error message");
	}

}
