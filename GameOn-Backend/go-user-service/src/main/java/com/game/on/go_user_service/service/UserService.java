package com.game.on.go_user_service.service;

import com.game.on.go_user_service.config.KeycloakProperties;
import com.game.on.go_user_service.dto.*;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.KeycloakCredential;
import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService {

    private final RestTemplate restTemplate;
    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final KeycloakProperties keycloakProperties;

    public List<UserResponse> getAllUsers() {
        String token = getKeycloakAdminToken();
        String url = keycloakProperties.getAdminUsersUrl();

        List<Map<String, Object>> users = keycloakGet(
                url,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        if(users == null || users.isEmpty()){
            return List.of();
        }

        return users.stream()
                .map(userMapper::fromMap)
                .map(userMapper::toUserResponse)
                .toList();
    }

   public UserResponse fetchUserById(Long userId) {
       var user = userRepository.findById(userId)
               .orElseThrow(() -> new UserNotFoundException(
                       String.format("User with id %s does not exist", userId)));
       return fetchUserByKeycloakId(user.getKeycloakId());
   }

    @Transactional
    public UserResponse createUser(UserRequestCreate userRequestCreate) {
        log.info("Creating user {} in Keycloak", userRequestCreate.email());

        String keycloakId = createUserInKeycloak(userRequestCreate);
        User userEntity = userMapper.toUser(userRequestCreate, keycloakId);
        userRepository.save(userEntity);
        return new UserResponse(userRequestCreate.email(), userRequestCreate.firstname(), userRequestCreate.lastname());
    }

    private String createUserInKeycloak(UserRequestCreate userRequestCreate) {
        String token = getKeycloakAdminToken();
        String url = keycloakProperties.getAdminUsersUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        KeycloakCredential credential = new KeycloakCredential(
                "password",
                userRequestCreate.password(),
                false
        );

        KeycloakUser keycloakUser = new KeycloakUser(
                userRequestCreate.email(),
                userRequestCreate.email(),
                userRequestCreate.firstname(),
                userRequestCreate.lastname(),
                true,
                List.of(credential)
        );

        HttpEntity<KeycloakUser> request = new HttpEntity<>(keycloakUser, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            log.info("Keycloak create user response: {}", response.getStatusCode());

            // Keycloak returns the user ID in the Location header
            String location = response.getHeaders().getFirst(HttpHeaders.LOCATION);
            if (location != null && location.contains("/users/")) {
                return location.substring(location.lastIndexOf("/") + 1);
            }

            throw new RuntimeException("Failed to get Keycloak ID from response");

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.CONFLICT) {
                log.error("User already exists in Keycloak: {}", userRequestCreate.email());
                throw new UserAlreadyExistsException(
                        String.format("User with email %s already exists", userRequestCreate.email())
                );
            }
            log.error("Keycloak returned error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Failed to create user in Keycloak", e);
        } catch (Exception e) {
            log.error("Unexpected error creating user in Keycloak", e);
            throw new RuntimeException("Failed to create user in Keycloak", e);
        }
    }

    public String getKeycloakAdminToken() {
        String url = keycloakProperties.getTokenUrl();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");
        map.add("client_id", keycloakProperties.getClientId());
        map.add("client_secret", keycloakProperties.getClientSecret());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
        return (String) response.get("access_token");
    }

    @Transactional
    public void updateUser(UserRequestUpdate userRequestUpdate){
        String token = getKeycloakAdminToken();
        String searchUrl = keycloakProperties.getAdminUsersUrl() + "?email=" + userRequestUpdate.email();

        List<Map<String, Object>> users = keycloakGet(
                searchUrl,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        if (users == null || users.isEmpty()) {
            throw new UserNotFoundException(
                    String.format("User with email %s does not exist", userRequestUpdate.email())
            );
        }

        String userId = (String) users.get(0).get("id");

        Map<String, Object> updatePayload = Map.of(
                "firstName", userRequestUpdate.firstname(),
                "lastName", userRequestUpdate.lastname()
        );

        String updateUrl = keycloakProperties.getAdminUsersUrl() + "/" + userId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);


        HttpEntity<Map<String, Object>> request = new HttpEntity<>(updatePayload, headers);
        restTemplate.exchange(updateUrl, HttpMethod.PUT, request, Void.class);

        User userEntity = userRepository.findByKeycloakId(userId)
                .orElseThrow(() -> new UserNotFoundException(
                        String.format("User with Keycloak ID %s not found in DB", userId)
                ));
        userRepository.save(userEntity);
    }

    @Transactional
    public void deleteUser(String userEmail) {
        String token = getKeycloakAdminToken();
        String searchUrl = keycloakProperties.getAdminUsersUrl() + "?email=" + userEmail;

        List<Map<String, Object>> users = keycloakGet(
                searchUrl,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        if (users == null || users.isEmpty()) {
            throw new UserNotFoundException(
                    String.format("User with email %s does not exist", userEmail)
            );
        }

        String userId = (String) users.get(0).get("id");

        // Delete in Keycloak
        String deleteUrl = keycloakProperties.getAdminUsersUrl() + "/" + userId;
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        restTemplate.exchange(deleteUrl, HttpMethod.DELETE, request, Void.class);

        // Delete in DB
        userRepository.findByKeycloakId(userId)
                .ifPresent(userRepository::delete);
    }

    public UserResponse fetchUserByEmail(String userEmail) {
        String token = getKeycloakAdminToken();
        String url = keycloakProperties.getAdminUsersUrl() + "?email=" + userEmail;

        List<Map<String, Object>> users = keycloakGet(
                url,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {}
        );

        if (users == null || users.isEmpty()) {
            throw new UserNotFoundException(
                    String.format("User with email %s does not exist", userEmail)
            );
        }

        Map<String, Object> userMap = users.get(0);
        KeycloakUser kcUser = userMapper.fromMap(userMap);
       return userMapper.toUserResponse(kcUser);
    }

    public UserResponse fetchUserByKeycloakId(String keycloakId) {
        String url = keycloakProperties.getAdminUsersUrl() + "/" + keycloakId;

        try {
            Map<String, Object> userMap = keycloakGet(
                    url,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (userMap == null || userMap.isEmpty()) {
                throw new UserNotFoundException(
                        String.format("User with Keycloak id %s does not exist", keycloakId)
                );
            }

            KeycloakUser kcUser = userMapper.fromMap(userMap);
            return userMapper.toUserResponse(kcUser);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new UserNotFoundException(
                        String.format("User with Keycloak id %s does not exist", keycloakId)
                );
            }
            throw e;
        }
    }



    private <T> T keycloakGet(String url, ParameterizedTypeReference<T> responseType) {
        String token = getKeycloakAdminToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<T> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                request,
                responseType
        );

        return response.getBody();
    }

}
