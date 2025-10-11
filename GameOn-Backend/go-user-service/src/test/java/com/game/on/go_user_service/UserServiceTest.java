package com.game.on.go_user_service;

import com.game.on.go_user_service.config.KeycloakProperties;
import com.game.on.go_user_service.dto.*;
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
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

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


    private static User userEntity(String keycloakId) {
        return new User(keycloakId); // uses the required args constructor
    }

    /** ------------------------ Tests ------------------------ **/

    @Test
    void fetchUserByEmailTest() {
        String email = "test1@email.com";
        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", email,
                "firstName", "Person",
                "lastName", "One",
                "enabled", true,
                "id", "123"
        );

        KeycloakUser kcUser = new KeycloakUser("test1", email, "Person", "One", true, null);
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
    void fetchUserByEmailNotFoundTest() {
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
    void createUserTest() {
        UserRequestCreate request = requestCreate("Person", "One", "test1@email.com", "Password123");

        // Simulate Keycloak creating user
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.CREATED)
                        .header(HttpHeaders.LOCATION, "http://localhost/users/123")
                        .build());

        // Simulate saving user in DB
        User userEntity = userEntity("123");
        when(userMapper.toUser(request, "123")).thenReturn(userEntity);
        when(userRepository.save(userEntity)).thenReturn(userEntity);

        UserResponse result = userService.createUser(request);

        // Directly matches the UserResponse built in the service
        assertThat(result.email()).isEqualTo("test1@email.com");
        assertThat(result.firstname()).isEqualTo("Person");
        assertThat(result.lastname()).isEqualTo("One");
    }




    @Test
    void createUserAlreadyExistsTest() {
        UserRequestCreate request = requestCreate("Person", "One", "test1@email.com", "Password123");

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new org.springframework.web.client.HttpClientErrorException(HttpStatus.CONFLICT));

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining(request.email());
    }

    @Test
    void updateUserTest() {
        UserRequestUpdate request = requestUpdate("NewFirst", "NewLast", "test1@email.com", "");

        Map<String, Object> kcMap = Map.of(
                "username", "test1",
                "email", "test1@email.com",
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
        when(userRepository.save(dbUser)).thenReturn(dbUser);

        userService.updateUser(request);

        verify(restTemplate).exchange(contains("/users/123"), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Void.class));
        verify(userRepository).save(dbUser);
    }

    @Test
    void updateUserNotFoundTest() {
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
    void deleteUserTest() {
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
    void deleteUserNotFoundTest() {
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
