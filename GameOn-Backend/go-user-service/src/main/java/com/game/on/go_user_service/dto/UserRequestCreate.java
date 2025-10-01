package com.game.on.go_user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import static com.game.on.go_user_service.dto.DtoConstants.*;

public record UserRequestCreate(

         @NotNull(message = VALIDATION_REQUIRED_FIRST_NAME)
         String firstname,

         @NotNull(message = VALIDATION_REQUIRED_LAST_NAME)
         String lastname,

         @Email(message = VALIDATION_PATTERN_EMAIL)
         @NotNull(message = VALIDATION_REQUIRED_EMAIL)
         String email,

         @NotNull(message = VALIDATION_REQUIRED_PASSWORD)
         @Size(min = MIN_LENGTH_PASSWORD, max = MAX_LENGTH_PASSWORD, message = VALIDATION_LENGTH_PASSWORD)
         @Pattern(regexp = REGEX_PASSWORD_PATTERN, message = VALIDATION_PATTERN_PASSWORD)
         String password

) implements UserRequest {
}
