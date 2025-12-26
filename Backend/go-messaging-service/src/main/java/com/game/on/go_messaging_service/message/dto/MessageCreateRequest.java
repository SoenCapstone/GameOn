package com.game.on.go_messaging_service.message.dto;

import jakarta.validation.constraints.NotBlank;

public record MessageCreateRequest(@NotBlank(message = "content cannot be empty") String content) {
}
