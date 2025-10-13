package com.game.on.go_user_service;

import com.game.on.go_user_service.config.KeycloakProperties;
import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import com.game.on.go_user_service.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private KeycloakProperties keycloakProperties;

    @BeforeEach
    void setup() {
        userService = spy(userService);
        doReturn("fake-admin-token").when(userService).getKeycloakAdminToken();

        lenient().when(keycloakProperties.getAdminUsersUrl()).thenReturn("http://localhost/users");
        lenient().when(keycloakProperties.getTokenUrl()).thenReturn("http://localhost/token");
        lenient().when(keycloakProperties.getClientId()).thenReturn("client-id");
        lenient().when(keycloakProperties.getClientSecret()).thenReturn("client-secret");
    }

    private static UserRequestCreate requestCreate(String firstname, String lastname, String email, String password) {
        return new UserRequestCreate(firstname, lastname, email, password);
    }

    private static UserRequestUpdate requestUpdate(String firstname, String lastname, String email, String password) {
        return new UserRequestUpdate(firstname, lastname, email, password);
    }

    private static UserResponse response(String firstname, String lastname, String email) {
        return new UserResponse(email, firstname, lastname);
    }

    private static KeycloakUser kcUser(String username, String email) {
        return new KeycloakUser(username, email, "Person", "One", true, null);
    }

    private static User userEntity(String keycloakId) {
        return new User(keycloakId);
    }

    @Test
    void fetchUserByEmail_returnsUser() {
        String email = "test1@email.com";
        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", email,
                "firstName", "Person",
                "lastName", "One",
                "enabled", true,
                "id", "123"
        );

        KeycloakUser kcUser = kcUser("test1", email);
        when(restTemplate.exchange(
                contains("/users?email=" + email),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(kcMap), HttpStatus.OK));

        when(userMapper.fromMap(kcMap)).thenReturn(kcUser);
        when(userMapper.toUserResponse(kcUser)).thenReturn(response("Person", "One", email));

        UserResponse result = userService.fetchUserByEmail(email);

        assertThat(result.email()).isEqualTo(email);
        assertThat(result.firstname()).isEqualTo("Person");
        assertThat(result.lastname()).isEqualTo("One");
    }

    @Test
    void fetchUserByEmail_missingUser_throws() {
        String email = "missing@email.com";

        when(restTemplate.exchange(
                contains("/users?email=" + email),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(), HttpStatus.OK));

        assertThatThrownBy(() -> userService.fetchUserByEmail(email))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining(email);
    }

    @Test
    void fetchUserById_delegatesToKeycloak() {
        Long id = 1L;
        User userEntity = new User("kc-123");
        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", "test1@email.com",
                "firstName", "Person",
                "lastName", "One",
                "enabled", true
        );
        KeycloakUser kcUser = kcUser("test1", "test1@email.com");

        when(userRepository.findById(id)).thenReturn(Optional.of(userEntity));
        when(restTemplate.exchange(
                contains("/users/kc-123"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(kcMap, HttpStatus.OK));
        when(userMapper.fromMap(kcMap)).thenReturn(kcUser);
        when(userMapper.toUserResponse(kcUser)).thenReturn(response("Person", "One", "test1@email.com"));

        UserResponse result = userService.fetchUserById(id);

        assertThat(result.email()).isEqualTo("test1@email.com");
    }

    @Test
    void fetchUserById_missingLocalUser_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.fetchUserById(99L))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void createUser_createsInKeycloakAndDb() {
        UserRequestCreate request = requestCreate("Person", "One", "test1@email.com", "Password123");

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.CREATED)
                        .header(HttpHeaders.LOCATION, "http://localhost/users/123")
                        .build());

        User userEntity = userEntity("123");
        when(userMapper.toUser(request, "123")).thenReturn(userEntity);

        UserResponse result = userService.createUser(request);

        assertThat(result.email()).isEqualTo(request.email());
        verify(userRepository).save(userEntity);
    }

    @Test
    void createUser_existingKeycloakUser_throws() {
        UserRequestCreate request = requestCreate("Person", "One", "test1@email.com", "Password123");

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT));

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining(request.email());
    }

    @Test
    void updateUser_updatesKeycloakAndDb() {
        UserRequestUpdate request = requestUpdate("NewFirst", "NewLast", "test1@email.com", "");
        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", request.email(),
                "firstName", "OldFirst",
                "lastName", "OldLast",
                "enabled", true,
                "id", "123"
        );

        when(restTemplate.exchange(
                contains("/users?email=" + request.email()),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(kcMap), HttpStatus.OK));
        when(restTemplate.exchange(
                contains("/users/123"),
                eq(HttpMethod.PUT),
                any(HttpEntity.class),
                eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        User dbUser = userEntity("123");
        when(userRepository.findByKeycloakId("123")).thenReturn(Optional.of(dbUser));

        userService.updateUser(request);

        verify(restTemplate).exchange(contains("/users/123"), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Void.class));
        verify(userRepository).save(dbUser);
    }

    @Test
    void updateUser_missingKeycloakUser_throws() {
        UserRequestUpdate request = requestUpdate("NewFirst", "NewLast", "missing@email.com", "");

        when(restTemplate.exchange(
                contains("/users?email=" + request.email()),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(), HttpStatus.OK));

        assertThatThrownBy(() -> userService.updateUser(request))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void deleteUser_deletesFromKeycloakAndDb() {
        String email = "test1@email.com";
        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", email,
                "firstName", "Person",
                "lastName", "One",
                "enabled", true,
                "id", "123"
        );

        when(restTemplate.exchange(
                contains("/users?email=" + email),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(kcMap), HttpStatus.OK));
        when(restTemplate.exchange(
                contains("/users/123"),
                eq(HttpMethod.DELETE),
                any(HttpEntity.class),
                eq(Void.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.NO_CONTENT));

        User dbUser = userEntity("123");
        when(userRepository.findByKeycloakId("123")).thenReturn(Optional.of(dbUser));

        userService.deleteUser(email);

        verify(restTemplate).exchange(contains("/users/123"), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Void.class));
        verify(userRepository).delete(dbUser);
    }

    @Test
    void deleteUser_missingKeycloakUser_throws() {
        String email = "missing@email.com";

        when(restTemplate.exchange(
                contains("/users?email=" + email),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                any(ParameterizedTypeReference.class)
        )).thenReturn(new ResponseEntity<>(List.of(), HttpStatus.OK));

        assertThatThrownBy(() -> userService.deleteUser(email))
                .isInstanceOf(UserNotFoundException.class);
    }
}
