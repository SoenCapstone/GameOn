package com.game.on.go_user_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.on.go_user_service.client.KeycloakAdminClient;
import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.exception.KeycloakResponseParsingException;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.KeycloakCredential;
import com.game.on.go_user_service.model.KeycloakUser;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import com.game.on.go_user_service.service.UserService;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock KeycloakAdminClient keycloakAdminClient;
    @Mock UserMapper userMapper;
    @Mock UserRepository userRepository;
    @Mock ObjectMapper objectMapper;

    private UserService service;

    private static final int EMAIL_IDX = 0;
    private static final String F_ID = "id";
    private static final String F_FIRST = "firstName";
    private static final String F_LAST = "lastName";
    private static final String H_LOCATION = "Location";

    private static final List<KeycloakCredential> NO_CREDS = List.of();

    @BeforeEach
    void setup() {
        service = new UserService(keycloakAdminClient, userMapper, userRepository, objectMapper);
    }

    @Test
    void getAllUsers_returnsEmptyList_whenKeycloakReturnsEmpty() {
        when(keycloakAdminClient.getAllUsers(0, 100)).thenReturn(Collections.emptyList());

        var result = service.getAllUsers();

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verifyNoInteractions(userRepository, objectMapper);
    }

    @Test
    void getAllUsers_mapsEachEntry() {
        Map<String, Object> u1 = Map.of("id", "kc-1");
        Map<String, Object> u2 = Map.of("id", "kc-2");
        when(keycloakAdminClient.getAllUsers(0, 100)).thenReturn(List.of(u1, u2));

        KeycloakUser ku1 = new KeycloakUser("a@a.com", "a@a.com", "A", "One", true, NO_CREDS);
        KeycloakUser ku2 = new KeycloakUser("b@b.com", "b@b.com", "B", "Two", true, NO_CREDS);

        when(userMapper.fromMap(u1)).thenReturn(ku1);
        when(userMapper.fromMap(u2)).thenReturn(ku2);

        UserResponse r1 = new UserResponse("a@a.com", "A", "One");
        UserResponse r2 = new UserResponse("b@b.com", "B", "Two");
        when(userMapper.toUserResponse(ku1)).thenReturn(r1);
        when(userMapper.toUserResponse(ku2)).thenReturn(r2);

        var out = service.getAllUsers();

        assertEquals(2, out.size());
        assertEquals(r1, out.get(0));
        assertEquals(r2, out.get(1));
    }

    @Test
    void fetchUserById_happyPath() {
        long id = 42L;
        User userEntity = new User();
        userEntity.setId(id);
        userEntity.setKeycloakId("kc-42");

        when(userRepository.findById(id)).thenReturn(Optional.of(userEntity));

        Map<String, Object> kcMap = Map.of("id", "kc-42", "firstName", "Neo");
        when(keycloakAdminClient.getUser("kc-42")).thenReturn(kcMap);

        KeycloakUser kcUser = new KeycloakUser("neo@matrix.io", "neo@matrix.io", "Neo", "Anderson", true, NO_CREDS);
        when(objectMapper.convertValue(kcMap, KeycloakUser.class)).thenReturn(kcUser);

        UserResponse expected = new UserResponse("neo@matrix.io", "Neo", "Anderson");
        when(userMapper.toUserResponse(kcUser)).thenReturn(expected);

        var out = service.fetchUserById(id);

        assertEquals(expected, out);
    }

    @Test
    void fetchUserById_throws_whenUserNotInDb() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(UserNotFoundException.class, () -> service.fetchUserById(99L));
        verifyNoInteractions(keycloakAdminClient);
    }

    @Test
    void fetchUserByKeycloakId_happyPath() {
        String kcId = "kc-abc";
        Map<String, Object> kcMap = Map.of("id", kcId, "firstName", "Luca");
        when(keycloakAdminClient.getUser(kcId)).thenReturn(kcMap);

        KeycloakUser kcUser = new KeycloakUser("luca@example.com", "luca@example.com", "Luca", "So", true, NO_CREDS);
        when(objectMapper.convertValue(kcMap, KeycloakUser.class)).thenReturn(kcUser);

        UserResponse expected = new UserResponse("luca@example.com", "Luca", "So");
        when(userMapper.toUserResponse(kcUser)).thenReturn(expected);

        var out = service.fetchUserByKeycloakId(kcId);
        assertEquals(expected, out);
    }

    @Test
    void fetchUserByKeycloakId_throwsNotFound_whenClientThrows() {
        String kcId = "kc-missing";
        when(keycloakAdminClient.getUser(kcId)).thenThrow(new RuntimeException("404"));

        assertThrows(UserNotFoundException.class, () -> service.fetchUserByKeycloakId(kcId));
    }

    @Test
    void fetchUserByEmail_happyPath_usesFirstOccurrenceAndMaps() {
        String email = "john@example.com";

        Map<String, Object> first = new HashMap<>();
        first.put(F_ID, "kc-1");
        first.put(F_FIRST, "John");
        first.put(F_LAST, "Doe");

        List<Map<String, Object>> kcList = List.of(first);
        when(keycloakAdminClient.findUserByEmail(email, true, EMAIL_IDX)).thenReturn(kcList);

        KeycloakUser kcUser = new KeycloakUser(email, email, "John", "Doe", true, NO_CREDS);
        when(userMapper.fromMap(first)).thenReturn(kcUser);

        UserResponse expected = new UserResponse(email, "John", "Doe");
        when(userMapper.toUserResponse(kcUser)).thenReturn(expected);

        var out = service.fetchUserByEmail(email);
        assertEquals(expected, out);
    }

    @Test
    void fetchUserByEmail_throws_whenNoResults() {
        when(keycloakAdminClient.findUserByEmail("none@x.com", true, EMAIL_IDX))
                .thenReturn(Collections.emptyList());

        assertThrows(UserNotFoundException.class, () -> service.fetchUserByEmail("none@x.com"));
    }

    @Test
    void createUser_happyPath_savesDbAndReturnsResponse() {
        UserRequestCreate req = new UserRequestCreate("neo@matrix.io", "Neo", "Anderson", "P@ssw0rd!");

        KeycloakUser kcPayload = new KeycloakUser(req.email(), req.email(), req.firstname(), req.lastname(), true, NO_CREDS);
        when(userMapper.toKeycloakUser(req)).thenReturn(kcPayload);

        String newKcId = "kc-new-123";
        Response feignResponse = Response.builder()
                .status(201)
                .request(dummyRequest("POST", "http://k/realm/users"))
                .headers(Map.of(H_LOCATION, List.of("http://localhost:8080/admin/realms/gameon/users/" + newKcId)))
                .build();

        when(keycloakAdminClient.createUser(kcPayload)).thenReturn(feignResponse);

        User userEntity = new User();
        when(userMapper.toUser(req, newKcId)).thenReturn(userEntity);

        var out = service.createUser(req);

        assertEquals(new UserResponse(req.email(), req.firstname(), req.lastname()), out);
        verify(userRepository).save(userEntity);
    }

    @Test
    void createUser_throwsAlreadyExists_on409() {
        UserRequestCreate req = new UserRequestCreate("dup@x.com", "Du", "Plic", "pwd");
        KeycloakUser kcPayload = new KeycloakUser(req.email(), req.email(), req.firstname(), req.lastname(), true, NO_CREDS);
        when(userMapper.toKeycloakUser(req)).thenReturn(kcPayload);

        Response conflict = Response.builder()
                .status(409)
                .request(dummyRequest("POST", "http://k/realm/users"))
                .headers(Collections.emptyMap())
                .build();

        when(keycloakAdminClient.createUser(kcPayload)).thenReturn(conflict);

        assertThrows(UserAlreadyExistsException.class, () -> service.createUser(req));
        verifyNoInteractions(userRepository);
    }

    @Test
    void createUser_throwsParsing_whenLocationMissing() {
        UserRequestCreate req = new UserRequestCreate("x@x.com", "X", "Y", "pwd");
        KeycloakUser kcPayload = new KeycloakUser(req.email(), req.email(), req.firstname(), req.lastname(), true, NO_CREDS);
        when(userMapper.toKeycloakUser(req)).thenReturn(kcPayload);

        Response createdNoHeader = Response.builder()
                .status(201)
                .request(dummyRequest("POST", "http://k/realm/users"))
                .headers(Collections.emptyMap())
                .build();

        when(keycloakAdminClient.createUser(kcPayload)).thenReturn(createdNoHeader);

        assertThrows(KeycloakResponseParsingException.class, () -> service.createUser(req));
    }

    @Test
    void updateUser_happyPath_updatesKeycloak_thenDb() {
        String email = "john@example.com";

        Map<String, Object> first = new HashMap<>();
        first.put(F_ID, "kc-1");
        first.put(F_FIRST, "John");
        first.put(F_LAST, "Doe");

        when(keycloakAdminClient.findUserByEmail(email, true, EMAIL_IDX))
                .thenReturn(List.of(first));

        UserRequestUpdate req = new UserRequestUpdate(
                "",
                "NewLast",
                email,
                "P@ssw0rd!"
        );

        doNothing().when(keycloakAdminClient).updateUser(eq("kc-1"), anyMap());

        User dbUser = new User();
        dbUser.setKeycloakId("kc-1");
        when(userRepository.findByKeycloakId("kc-1")).thenReturn(Optional.of(dbUser));

        service.updateUser(req);

        // Verify payload fields sent to Keycloak
        ArgumentCaptor<Map<String, Object>> cap = ArgumentCaptor.forClass(Map.class);
        verify(keycloakAdminClient).updateUser(eq("kc-1"), cap.capture());
        Map<String, Object> payload = cap.getValue();
        assertEquals("John", payload.get(F_FIRST));
        assertEquals("NewLast", payload.get(F_LAST));

        verify(userRepository).save(dbUser);
    }

    @Test
    void updateUser_throws_whenDbUserMissing() {
        String email = "missing@example.com";

        Map<String, Object> first = Map.of(F_ID, "kc-404", F_FIRST, "A", F_LAST, "B");
        when(keycloakAdminClient.findUserByEmail(email, true, EMAIL_IDX))
                .thenReturn(List.of(first));
        doNothing().when(keycloakAdminClient).updateUser(eq("kc-404"), anyMap());
        when(userRepository.findByKeycloakId("kc-404")).thenReturn(Optional.empty());

        UserRequestUpdate req = new UserRequestUpdate("A", "B", email, "P@ssw0rd!");

        assertThrows(UserNotFoundException.class, () -> service.updateUser(req));
    }

    @Test
    void deleteUser_happyPath_deletesKeycloak_thenDbIfPresent() {
        String email = "del@example.com";

        Map<String, Object> first = Map.of(F_ID, "kc-del", F_FIRST, "Del", F_LAST, "User");
        when(keycloakAdminClient.findUserByEmail(email, true, EMAIL_IDX))
                .thenReturn(List.of(first));

        doNothing().when(keycloakAdminClient).deleteUser("kc-del");

        User dbUser = new User();
        dbUser.setKeycloakId("kc-del");
        when(userRepository.findByKeycloakId("kc-del")).thenReturn(Optional.of(dbUser));

        service.deleteUser(email);

        InOrder inOrder = inOrder(keycloakAdminClient, userRepository);
        inOrder.verify(keycloakAdminClient).deleteUser("kc-del");
        inOrder.verify(userRepository).delete(dbUser);
    }

    @Test
    void deleteUser_noDbRecord_onlyDeletesKeycloak() {
        String email = "del2@example.com";

        Map<String, Object> first = Map.of(F_ID, "kc-del2", F_FIRST, "Del2", F_LAST, "User2");
        when(keycloakAdminClient.findUserByEmail(email, true, EMAIL_IDX))
                .thenReturn(List.of(first));

        doNothing().when(keycloakAdminClient).deleteUser("kc-del2");
        when(userRepository.findByKeycloakId("kc-del2")).thenReturn(Optional.empty());

        service.deleteUser(email);

        verify(keycloakAdminClient).deleteUser("kc-del2");
        verify(userRepository, never()).delete(any());
    }

    private static Request dummyRequest(String method, String url) {
        return Request.create(
                Request.HttpMethod.valueOf(method),
                url,
                new HashMap<>(),
                new byte[0],
                StandardCharsets.UTF_8,
                null
        );
    }
}
