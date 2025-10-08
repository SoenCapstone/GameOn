package com.game.on.go_user_service.service;

import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
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

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public List<UserResponse> getAllUsers(){
        return userRepository.findAll()
                .stream().map(userMapper::toUserResponse).toList();
    }

    public UserResponse fetchUserByEmail(String userEmail){
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(
                        format("User with email %s does not exist", userEmail)));

        return userMapper.toUserResponse(user);
    }

    public UserResponse fetchUserById(Long userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(
                        format("User with id %s does not exist", userId)));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserRequestCreate userRequestCreate){
        userRepository.findByEmail(userRequestCreate.email())
                .ifPresent( user -> {
                    throw new UserAlreadyExistsException(
                            format("User with email %s already exists", userRequestCreate.email()));
        });

        log.info("Creating user {} with id", userRequestCreate.email());
        return userMapper.toUserResponse(userRepository.save(userMapper.toUser(userRequestCreate)));
    }

    @Transactional
    public void updateUser(UserRequestUpdate userRequestUpdate){
        var user = userRepository.findByEmail(userRequestUpdate.email())
                .orElseThrow(() ->
                        new UserNotFoundException(
                                format("User with email %s does not exist", userRequestUpdate.email())));

        User newUserInfo = userMapper.toUser(userRequestUpdate);
        mergeUser(newUserInfo, user);

        log.info("Updating user {} with id {}", user.getEmail(), user.getId());
        userRepository.save(user);
    }

    public void deleteUser(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserNotFoundException(
                        format("User with email %s does not exist", userEmail)));

        log.info("Deleting user {} with id {}", userEmail, user.getId());
        userRepository.deleteById(user.getId());
    }

    private void mergeUser(User newUserInfo, User user){
        if(StringUtils.isNotBlank(newUserInfo.getFirstname())){
            user.setFirstname(newUserInfo.getFirstname());
        }
        if(StringUtils.isNotBlank(newUserInfo.getLastname())){
            user.setLastname(newUserInfo.getLastname());
        }
        if(StringUtils.isNotBlank(newUserInfo.getPassword())){
            user.setPassword(newUserInfo.getPassword());
        }
    }

}
