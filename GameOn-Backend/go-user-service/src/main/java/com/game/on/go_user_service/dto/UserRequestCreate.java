package com.game.on.go_user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

import static com.game.on.go_user_service.utils.constants.DtoConstants.*;

/* No password required as auth is handle by 3rd party */
public record UserRequestCreate(
         @NotNull(message = VALIDATION_REQUIRED_ACCOUNT_ID)
         String id,

         @NotNull(message = VALIDATION_REQUIRED_FIRST_NAME)
         String firstname,

         @NotNull(message = VALIDATION_REQUIRED_LAST_NAME)
         String lastname,

         @Email(message = VALIDATION_PATTERN_EMAIL)
         @NotNull(message = VALIDATION_REQUIRED_EMAIL)
         String email
) implements UserRequest {}