package com.game.on.go_user_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients(basePackages = "com.game.on.go_user_service")
public class GoUserServiceApplication {

    public static void main(String[] args) {SpringApplication.run(GoUserServiceApplication.class, args);}

}
