package com.game.on.go_user_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.on.go_user_service.client.KeycloakAdminClient;
import com.game.on.go_user_service.dto.*;
import com.game.on.go_user_service.exception.KeycloakResponseParsingException;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import feign.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.game.on.go_user_service.utils.constants.KeycloakConstants.*;
import static java.lang.String.format;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService {

    private final KeycloakAdminClient keycloakAdminClient;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<UserResponse> getAllUsers() {
        List<Map<String, Object>> users = keycloakAdminClient.getAllUsers(0, 100);
        if (users == null || users.isEmpty()) {
            return List.of();
        }

        return users.stream().map(user -> userMapper.fromMap(user))
            .map(keycloakUser -> userMapper.toUserResponse(keycloakUser)).toList();
    }

    public UserResponse fetchUserById(Long userId) {
       var user = userRepository.findById(userId)
               .orElseThrow(() -> new UserNotFoundException(
                       String.format("User with id %s does not exist", userId)));

       KeycloakUser keycloakUser = objectMapper.convertValue(
               keycloakAdminClient.getUser(user.getKeycloakId()), KeycloakUser.class);
       return userMapper.toUserResponse(keycloakUser);
   }

    public UserResponse fetchUserByKeycloakId(String keycloakId) {
        log.info("Fetching user with KEYCLOAK id {}", keycloakId);

        Map<String, Object> user;
        try {
            user = keycloakAdminClient.getUser(keycloakId);
        }
        catch(Exception e){
            throw new UserNotFoundException(String.format("User with Keycloak ID %s not found in KEYCLOAK", keycloakId));
        }

        KeycloakUser keycloakUser = objectMapper.convertValue(user, KeycloakUser.class);
        return userMapper.toUserResponse(keycloakUser);
    }

    public UserResponse fetchUserByEmail(String userEmail) {
        log.info("Fetching user by email KEYCLOAK {}", userEmail);

        Map<String, Object> responseFirstEmailOccurrence = fetchKeycloakByEmail(userEmail)
                .get(KEYCLOAK_EMAIL_OCCURRENCE);
        return userMapper.toUserResponse(userMapper.fromMap(responseFirstEmailOccurrence));
    }

    @Transactional
    public UserResponse createUser(UserRequestCreate userRequestCreate) {
        log.info("Creating user {} in Keycloak", userRequestCreate.email());

        KeycloakUser keycloakUser = userMapper.toKeycloakUser(userRequestCreate);
        var response = keycloakAdminClient.createUser(keycloakUser);

        int status = response.status();
        if(status == 409){
            throw new UserAlreadyExistsException(format("User with email %s already exists.", userRequestCreate.email()));
        }

        User userEntity = userMapper.toUser(userRequestCreate, extractKeycloakIDFromHeaders(response));
        userRepository.save(userEntity);
        return new UserResponse(userRequestCreate.email(), userRequestCreate.firstname(), userRequestCreate.lastname());
    }

    @Transactional
    public void updateUser(UserRequestUpdate userRequestUpdate){
        log.info("Updating user with email {} ", userRequestUpdate.email());

        Map<String, Object> responseFirstEmailOccurrence = fetchKeycloakByEmail(userRequestUpdate.email())
                .get(KEYCLOAK_EMAIL_OCCURRENCE);
        String userId = (String) responseFirstEmailOccurrence.get(KEYCLOAK_ID_FIELD);

        /* Update request can contain missing fields */
        /* TO DO: Allow password updates */
        Map<String, Object> updatePayload = Map.of(
                KEYCLOAK_FIRST_NAME_FIELD, StringUtils.isBlank(userRequestUpdate.firstname()) ?
                        responseFirstEmailOccurrence.get(KEYCLOAK_FIRST_NAME_FIELD) : userRequestUpdate.firstname(),
                KEYCLOAK_LAST_NAME_FIELD, StringUtils.isBlank(userRequestUpdate.lastname()) ?
                        responseFirstEmailOccurrence.get(KEYCLOAK_LAST_NAME_FIELD) : userRequestUpdate.lastname()
        );

        log.info("Updating KEYCLOAK user {}", userId);
        keycloakAdminClient.updateUser(userId, updatePayload);

        User userEntity = userRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new UserNotFoundException(
                        String.format("User with Keycloak ID %s not found in DB", userId)
                ));

        log.info("Updating DATABASE user {}", userId);
        userRepository.save(userEntity);
    }

    @Transactional
    public void deleteUser(String userEmail) {
        Map<String, Object> responseFirstEmailOccurrence = fetchKeycloakByEmail(userEmail)
                .get(KEYCLOAK_EMAIL_OCCURRENCE);
        String userId = (String) responseFirstEmailOccurrence.get(KEYCLOAK_ID_FIELD);

        log.info("Deleting user in KEYCLOAK with email {} and id {}", userEmail, userId);
        keycloakAdminClient.deleteUser(userId);

        log.info("Deleting user in DATABASE with email {} and id {}", userEmail, userId);
        userRepository.findByKeycloakId(userId)
                .ifPresent(userRepository::delete);
    }


    private List<Map<String, Object>> fetchKeycloakByEmail(String email){
        List<Map<String, Object>> user = keycloakAdminClient.findUserByEmail(email, true, KEYCLOAK_EMAIL_OCCURRENCE);
        if (user == null || user.isEmpty()) {
            throw new UserNotFoundException(String.format("User with email %s does not exist", email));
        }

        return user;
    }

    private String extractKeycloakIDFromHeaders(Response response) {
        return Optional.ofNullable(response.headers().get(KEYCLOAK_HEADER_LOCATION_FIELD))
                .flatMap(headers -> headers.stream().findFirst())
                .map(location -> location.substring(location.lastIndexOf('/') + 1))
                .orElseThrow(() -> new KeycloakResponseParsingException("Failed to get Keycloak ID from response"));
    }
}
