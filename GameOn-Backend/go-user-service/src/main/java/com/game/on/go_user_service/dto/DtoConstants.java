package com.game.on.go_user_service.dto;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class DtoConstants {

    public static final String VALIDATION_REQUIRED_FIRST_NAME = "First name is required.";
    public static final String VALIDATION_REQUIRED_LAST_NAME = "Last name is required.";
    public static final String VALIDATION_REQUIRED_EMAIL = "Email name is required.";
    public static final String VALIDATION_REQUIRED_PASSWORD = "Password name is required.";
    public static final String VALIDATION_PATTERN_PASSWORD = "Password must contain at least one digit, one lowercase, one uppercase, and one special character";
    public static final String VALIDATION_PATTERN_EMAIL = "Email must have a valid format.";
    public static final String VALIDATION_LENGTH_PASSWORD = "Password must be between 8 and 64 characters";

    public static final String REGEX_PASSWORD_PATTERN = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$";
    public static final int MIN_LENGTH_PASSWORD = 8;
    public static final int MAX_LENGTH_PASSWORD = 64;

}
