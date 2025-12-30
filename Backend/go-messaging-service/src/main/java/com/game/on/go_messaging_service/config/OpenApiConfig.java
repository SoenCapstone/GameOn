package com.game.on.go_messaging_service.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI messagingOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("GameOn Messaging Service API")
                        .description("REST and WebSocket contracts for conversations and messages")
                        .version("v1"))
                .externalDocs(new ExternalDocumentation()
                        .description("GameOn Documentation")
                        .url("https://github.com/Johnny-Aldeb/GameOn"));
    }
}
