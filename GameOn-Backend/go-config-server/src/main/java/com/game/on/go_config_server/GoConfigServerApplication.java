package com.game.on.go_config_server;

import lombok.extern.log4j.Log4j2;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

@SpringBootApplication
@Log4j2
@EnableConfigServer
public class GoConfigServerApplication {

    public static void main(String[] args) {
		SpringApplication.run(GoConfigServerApplication.class, args);
	}
}
