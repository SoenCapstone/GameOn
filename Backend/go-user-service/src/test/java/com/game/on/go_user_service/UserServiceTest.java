package com.game.on.go_user_service;

import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import com.game.on.go_user_service.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    private static UserRequestCreate requestCreate(String id, String firstname, String lastname, String email){
        return new UserRequestCreate(id, firstname, lastname, email);
    }

    private static UserRequestUpdate requestUpdate(String id, String firstname, String lastname, String email){
        return new UserRequestUpdate(id, firstname, lastname, email);
    }

    private static User user(String id, String firstname, String lastname, String email){
        return User.builder()
                .id(id)
                .firstname(firstname)
                .lastname(lastname)
                .email(email)
                .build();
    }

    private static UserResponse response(String id, String firstname, String lastname, String email){
        return new UserResponse(id, email, firstname, lastname);
    }

    @Test
    void getAllUsersTest(){
        var user1 = user("1234", "Person","One","test1@email.com");
        var user2 = user("5678", "Person", "Two","test2@email.com");

        when(userRepository.findAll()).thenReturn(List.of(user1, user2));
        when(userMapper.toUserResponse(user1)).thenReturn(response("1234","Person", "One", "test1@email.com"));
        when(userMapper.toUserResponse(user2)).thenReturn(response("5678","Person", "Two", "test2@email.com"));

        var getAllUsersResponse = userService.getAllUsers();

        assertThat(getAllUsersResponse).hasSize(2);
        assertThat(getAllUsersResponse.get(0).email()).isEqualTo("test1@email.com");
        assertThat(getAllUsersResponse.get(1).email()).isEqualTo("test2@email.com");

        verify(userRepository).findAll();
        verify(userMapper).toUserResponse(user1);
        verify(userMapper).toUserResponse(user2);
    }

    @Test
    void fetchUserByEmailTest(){
        var u = user("1234", "Person","One","test1@email.com");

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.of(u));
        when(userMapper.toUserResponse(u)).thenReturn(response("1234","Person", "One", "test1@email.com"));

        var res = userService.fetchUserByEmail("test1@email.com");

        assertThat(res.email()).isEqualTo("test1@email.com");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userMapper).toUserResponse(u);
    }

    @Test
    void fetchUserByEmailTestUserNotFoundException(){
        when(userRepository.findByEmail("userNotFound@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.fetchUserByEmail("userNotFound@email.com"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User with Email userNotFound@email.com is not found");

        verify(userRepository).findByEmail("userNotFound@email.com");
        verifyNoInteractions(userMapper);
    }

    @Test
    public void createUserTest(){
        var req = requestCreate("1234","Person","One","test1@email.com");
        var u = user("1234","Person","One","test1@email.com");

        when(userRepository.findById("1234")).thenReturn(Optional.empty());
        when(userMapper.toUser(req)).thenReturn(u);
        when(userRepository.save(u)).thenReturn(u);

        var createUserResponse = userService.createUser(req);

        assertThat(createUserResponse.id()).isEqualTo("1234");
        assertThat(createUserResponse.email()).isEqualTo("test1@email.com");

        verify(userRepository).findById("1234");
        verify(userMapper).toUser(req);
        verify(userRepository).save(u);
        verifyNoMoreInteractions(userMapper);
    }

    @Test
    void createUserUserAlreadyExistsExceptionTest() {
        var req = requestCreate("1234","Person", "One", "test1@email.com");
        when(userRepository.findById("1234")).thenReturn(Optional.of(
                user("1234","Person", "One", "test1@email.com")));

        assertThatThrownBy(() -> userService.createUser(req))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("User with ID 1234 already exists");

        verify(userRepository).findById("1234");
        verify(userRepository, never()).save(any());
        verifyNoInteractions(userMapper);
    }

    @Test
    void updateUserSomeFieldsTest() {
        var existing = user("1234", "oldFirstname", "oldLastname","test1@email.com");
        var req = requestUpdate("1234","newFirstname","","test1@email.com");
        var newInfo = user("1234","newFirstname", "   ","test1@email.com"); // lastname blank -> ignored

        when(userRepository.findById("1234")).thenReturn(Optional.of(existing));
        when(userMapper.toUser(req)).thenReturn(newInfo);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(req);

        verify(userRepository).findById("1234");
        verify(userMapper).toUser(req);
        verify(userRepository).save(existing);

        assertThat(existing.getEmail()).isEqualTo("test1@email.com");
        assertThat(existing.getFirstname()).isEqualTo("newFirstname");
        assertThat(existing.getLastname()).isEqualTo("oldLastname"); // unchanged because blank in req
    }

    @Test
    void updateUserAllFieldsTest() {
        var existing = user("1234", "oldFirstname", "oldLastname","test1@email.com");
        var req = requestUpdate("1234","newFirstname", "newLastname", "test1@email.com");
        var newInfo = user("1234", "newFirstname", "newLastname", "test1@email.com");

        when(userRepository.findById("1234")).thenReturn(Optional.of(existing));
        when(userMapper.toUser(req)).thenReturn(newInfo);

        userService.updateUser(req);

        verify(userRepository).findById("1234");
        verify(userMapper).toUser(req);
        verify(userRepository).save(existing);

        assertThat(existing.getFirstname()).isEqualTo("newFirstname");
        assertThat(existing.getLastname()).isEqualTo("newLastname");
        assertThat(existing.getEmail()).isEqualTo("test1@email.com");
    }

    @Test
    void updateUserUserNotFoundExceptionTest() {
        var req = requestUpdate("1234","Person", "One","test1@email.com");
        when(userRepository.findById("1234")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(req))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User with Keycloak ID 1234 not found in DB");

        verify(userRepository).findById("1234");
        verify(userRepository, never()).save(any());
        verifyNoInteractions(userMapper);
    }

    @Test
    void deleteUserTest() {
        var existing = user("1234", "firstname", "lastname", "test1@email.com");

        when(userRepository.findById("1234")).thenReturn(Optional.of(existing));

        userService.deleteUser("1234");

        verify(userRepository).findById("1234");
        verify(userRepository).deleteById("1234");
    }

    @Test
    void deleteUser_missing_throwsNotFound() {
        when(userRepository.findById("1234")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("1234"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User with id 1234 was not found");

        verify(userRepository).findById("1234");
        verify(userRepository, never()).deleteById(anyString());
    }
}
