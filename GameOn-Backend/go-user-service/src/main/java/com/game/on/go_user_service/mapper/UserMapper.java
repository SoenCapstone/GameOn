package com.game.on.go_user_service.mapper;

import com.game.on.go_user_service.dto.UserRequest;
import com.game.on.go_user_service.model.KeycloakCredential;
import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.utils.constants.KeycloakConstants;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class UserMapper {

    public KeycloakUser toKeycloakUser(UserRequestCreate userRequestCreate){
        KeycloakCredential credential = new KeycloakCredential(
                KeycloakConstants.CREDENTIAL_TYPE,
                userRequestCreate.password(),
                KeycloakConstants.TEMPORARY
        );

        return new KeycloakUser(
                userRequestCreate.email(),
                userRequestCreate.email(),
                userRequestCreate.firstname(),
                userRequestCreate.lastname(),
                true,
                List.of(credential)
        );
    }

    // Keycloak -> Response
    public UserResponse toUserResponse(KeycloakUser user) {
        return new UserResponse( user.email(), user.firstName(), user.lastName());
    }

    // Map Keycloak API -> KeycloakUser
    public KeycloakUser fromMap(Map<String, Object> userMap) {
        return new KeycloakUser(
                (String) userMap.get("username"),
                (String) userMap.get("email"),
                (String) userMap.get("firstName"),
                (String) userMap.get("lastName"),
                (Boolean) userMap.get("enabled"),
                null
        );
    }

    // Request -> User entity (local DB)
    public User toUser(UserRequestCreate request, String keycloakId) {
        User entity = new User();
        entity.setKeycloakId(keycloakId);
        return entity;
    }

}
