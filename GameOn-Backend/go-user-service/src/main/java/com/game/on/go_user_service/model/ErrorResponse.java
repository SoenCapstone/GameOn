package com.game.on.go_user_service.model;

import java.util.Map;

public record ErrorResponse(
        Map<String, String> errors
) {
}
