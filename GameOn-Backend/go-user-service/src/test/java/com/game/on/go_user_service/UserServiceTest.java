package com.game.on.go_user_service;

import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.service.UserService;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.Mock;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    private static UserRequestCreate requestCreate(String firstname, String lastname, String email, String password){
        return new UserRequestCreate(firstname, lastname, email, password);
    }

    private static UserRequestUpdate requestUpdate(String firstname, String lastname, String email, String password){
        return new UserRequestUpdate(firstname, lastname, email, password);
    }

    private static User user(String firstname, String lastname, String email,  String password){
        return User.builder()
                .firstname(firstname)
                .lastname(lastname)
                .email(email)
                .password(password)
                .build();
    }

    private static UserResponse response(String firstname, String lastname, String email){
        return new UserResponse(firstname, lastname, email);
    }

    @Test
    void getAllUsersTest(){
        var user1 = user( "Person","One","test1@email.com",   "password1");
        var user2 = user( "Person", "Two","test2@email.com",  "password2");

        when(userRepository.findAll()).thenReturn(List.of(user1, user2));
        when(userMapper.toUserResponse(user1)).thenReturn(response("Person", "One", "test1@email.com"));
        when(userMapper.toUserResponse(user2)).thenReturn(response("Person", "Two", "test2@email.com"));

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
        var user1 = user( "Person","One","test1@email.com",   "password1");

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.of(user1));
        when(userMapper.toUserResponse(user1)).thenReturn(response("Person", "One", "test1@email.com"));

        var fetchUserByEmailResponse = userService.fetchUserByEmail("test1@email.com");

        assertThat(fetchUserByEmailResponse.email()).isEqualTo("test1@email.com");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userMapper).toUserResponse(user1);
    }

    @Test
    void fetchUserByEmailTestUserNotFoundException(){
        when(userRepository.findByEmail("userNotFound@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.fetchUserByEmail("userNotFound@email.com"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User with email userNotFound@email.com does not exist");

        verify(userRepository).findByEmail("userNotFound@email.com");
        verifyNoInteractions(userMapper);
    }

    @Test
    public void createUserTest(){
        var request = requestCreate("Person","One","test1@email.com",   "password1");
        var user = user( "Person","One","test1@email.com",   "password1");
        var response = response("Person","One","test1@email.com");

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.empty());
        when(userMapper.toUser(request)).thenReturn(user);
        when(userRepository.save(user)).thenReturn(user);
        when(userMapper.toUserResponse(user)).thenReturn(response);

        var createUserResponse = userService.createUser(request);

        assertThat(createUserResponse.email()).isEqualTo("test1@email.com");

        verify(userMapper).toUser(request);
        verify(userRepository).findByEmail("test1@email.com");
        verify(userRepository).save(user);
        verify(userMapper).toUserResponse(user);
    }

    @Test
    void createUserUserAlreadyExistsExceptionTest() {
        var request = requestCreate("Person", "One", "test1@email.com", "password");
        when(userRepository.findByEmail("test1@email.com")).thenReturn(
                Optional.of(
                        user("Person", "One", "test1@email.com", "password")));

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("User with email test1@email.com already exists");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserSomeFieldsTest() {
        var existing = user( "oldFirstname", "oldLastname","test1@email.com", "oldPassword");
        var req = requestUpdate("newFirstname","","test1@email.com",  "   ");
        var newInfo = user("newFirstname", "   ","test1@email.com", "");

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.of(existing));
        when(userMapper.toUser(req)).thenReturn(newInfo);

        ArgumentCaptor<User> savedCaptor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        userService.updateUser(req);

        verify(userRepository).findByEmail("test1@email.com");
        verify(userMapper).toUser(req);
        verify(userRepository).save(savedCaptor.capture());

        var saved = savedCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("test1@email.com");
        assertThat(saved.getFirstname()).isEqualTo("newFirstname");
        assertThat(saved.getLastname()).isEqualTo("oldLastname");
        assertThat(saved.getPassword()).isEqualTo("oldPassword");
    }

    @Test
    void updateUserAllFieldsTest() {
        var existing = user( "oldFirstname", "oldLastname","test1@email.com",  "oldPassword");
        var req = requestUpdate("newFirstname", "newLastname", "test1@email.com",  "newPassword");
        var newInfo = user( "newFirstname", "newLastname", "test1@email.com",  "newPassword");

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.of(existing));
        when(userMapper.toUser(req)).thenReturn(newInfo);

        userService.updateUser(req);

        verify(userRepository).save(existing);
        assertThat(existing.getFirstname()).isEqualTo("newFirstname");
        assertThat(existing.getLastname()).isEqualTo("newLastname");
        assertThat(existing.getPassword()).isEqualTo("newPassword");
    }

    @Test
    void updateUserUserNotFoundExceptionTest() {
        var request = requestUpdate("Person", "One","test1@email.com", "password");
        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUser(request))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("test1@email.com");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteUserTest() {
        var existing = user( "firstname", "lastname", "test1@email.com",  "password");
        existing.setId(1L);

        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.of(existing));

        userService.deleteUser("test1@email.com");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userRepository).deleteById(1L);
    }

    @Test
    void deleteUser_missing_throwsNotFound() {
        when(userRepository.findByEmail("test1@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser("test1@email.com"))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User with email test1@email.com does not exist");

        verify(userRepository).findByEmail("test1@email.com");
        verify(userRepository, never()).deleteById(anyLong());
    }


}
