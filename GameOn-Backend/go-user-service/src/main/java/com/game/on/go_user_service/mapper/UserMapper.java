package com.game.on.go_user_service.mapper;

import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.model.User;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class UserMapper {

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
