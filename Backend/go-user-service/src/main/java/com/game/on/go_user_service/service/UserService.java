package com.game.on.go_user_service.service;

import com.game.on.common.dto.UserResponse;
import com.game.on.go_user_service.dto.*;
import com.game.on.go_user_service.exception.UserAlreadyExistsException;
import com.game.on.go_user_service.exception.UserNotFoundException;
import com.game.on.go_user_service.mapper.UserMapper;
import com.game.on.go_user_service.model.User;
import com.game.on.go_user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static java.lang.String.format;

@Log4j2
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        var users = userRepository.findAll();
        if (users.isEmpty()) {
            return List.of();
        }

        return users.stream().map(userMapper::toUserResponse).toList();
    }

    public UserResponse fetchUserById(String userId) {
       var user = userRepository.findById(userId)
               .orElseThrow(() -> new UserNotFoundException(
                       String.format("User with id %s does not exist", userId)));

       return userMapper.toUserResponse(user);
   }

    public UserResponse fetchUserByEmail(String userEmail) {
        log.info("Fetching user by email {}", userEmail);
        var user = userRepository.findByEmail(userEmail).orElseThrow(
                () -> new UserNotFoundException(format("User with Email %s is not found", userEmail)));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserRequestCreate userRequestCreate) {
        log.info("Persisting user with email {} and ID {}", userRequestCreate.email(), userRequestCreate.id());

        var existingUser = userRepository.findById(userRequestCreate.id());
        if (existingUser.isPresent()) {
            throw new UserAlreadyExistsException(
                    format("User with ID %s already exists", userRequestCreate.id()));
        }

        userRepository.save(userMapper.toUser(userRequestCreate));
        return new UserResponse(userRequestCreate.id(), userRequestCreate.email(), userRequestCreate.firstname(), userRequestCreate.lastname());
    }

    @Transactional
    public void updateUser(UserRequestUpdate userRequestUpdate){
        log.info("Updating user with ID {} ", userRequestUpdate.id());

        String userId = userRequestUpdate.id();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(
                        String.format("User with Keycloak ID %s not found in DB", userId)
                ));
        mergeUser(userMapper.toUser(userRequestUpdate), user);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String userId) {
        log.info("Deleting user  with id {}", userId);
        userRepository.findById(userId).orElseThrow(
                () -> new UserNotFoundException(format("User with id %s was not found", userId)));
        userRepository.deleteById(userId);
    }

    private void mergeUser(User newUserInfo, User user){
        if(StringUtils.isNotBlank(newUserInfo.getFirstname())){
            user.setFirstname(newUserInfo.getFirstname());
        }
        if(StringUtils.isNotBlank(newUserInfo.getLastname())){
            user.setLastname(newUserInfo.getLastname());
        }
        if(StringUtils.isNotBlank(newUserInfo.getEmail())){
            user.setEmail(newUserInfo.getEmail());
        }
    }
}
