package com.game.on.go_user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

import static com.game.on.go_user_service.utils.constants.DtoConstants.*;

public record UserRequestUpdate(

        @NotNull
        String id,

        String firstname,

        String lastname,

        @Email(message = VALIDATION_PATTERN_EMAIL)
        String email
) implements UserRequest {
}
