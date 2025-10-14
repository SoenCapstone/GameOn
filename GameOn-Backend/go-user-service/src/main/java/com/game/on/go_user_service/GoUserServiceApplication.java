package com.game.on.go_user_service;

import com.game.on.go_user_service.feature_flags.FFUserService;
import com.game.on.go_user_service.feature_flags.UserServiceFeatureFlags;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

@SpringBootApplication
public class GoUserServiceApplication {

    private static final Logger log = LoggerFactory.getLogger(GoUserServiceApplication.class);
    @Autowired
    public UserServiceFeatureFlags userFlags;

    public static void main(String[] args) {SpringApplication.run(GoUserServiceApplication.class, args);}

    @EventListener(ApplicationReadyEvent.class)
    public void afterStart() {
        var success = userFlags.isFlagEnabled(FFUserService.USER_SERVICE_BASE);

        log.info("Was flag enabled? {}", success);

        success = userFlags.setFlag(FFUserService.USER_SERVICE_BASE, false);

        log.info("Was the flag successfully set? {}", success);

        success = userFlags.isFlagEnabled(FFUserService.USER_SERVICE_BASE);

        log.info("Is flag enabled? {}", success);
    }

}
