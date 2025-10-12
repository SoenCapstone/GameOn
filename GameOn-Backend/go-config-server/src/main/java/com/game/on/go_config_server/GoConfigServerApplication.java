package com.game.on.go_config_server;


import lombok.extern.log4j.Log4j2;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cloud.config.server.EnableConfigServer;
import org.springframework.context.event.EventListener;

@SpringBootApplication
@Log4j2
@EnableConfigServer
public class GoConfigServerApplication {

    @Autowired
    private GlobalFeatureFlags gFlags;

    private static final Logger log = LoggerFactory.getLogger(GoConfigServerApplication.class);

    public static void main(String[] args) {
		SpringApplication.run(GoConfigServerApplication.class, args);
	}

    @EventListener(ApplicationReadyEvent.class)
    public void afterStart() {
        gFlags.Test();
    }
}
