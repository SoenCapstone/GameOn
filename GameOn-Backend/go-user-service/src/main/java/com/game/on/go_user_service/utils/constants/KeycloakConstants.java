package com.game.on.go_user_service.utils.constants;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class KeycloakConstants {
    public static final String CREDENTIAL_TYPE = "password";
    public static final boolean TEMPORARY = false;
    public static final String KEYCLOAK_HEADER_LOCATION_FIELD = "Location";
    public static final String KEYCLOAK_FIRST_NAME_FIELD = "firstName";
    public static final String KEYCLOAK_LAST_NAME_FIELD = "lastName";
    public static final String KEYCLOAK_ID_FIELD = "id";
    public static final int KEYCLOAK_EMAIL_OCCURRENCE = 0;
}
