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

    /**
     * Fetches a user by their Clerk ID.
     * If the user does not exist in the DB (e.g. sign-up sync failed),
     * a stub record is auto-created so downstream callers never break.
     * The stub will be filled in when the user next updates their profile.
     */
    @Transactional
    public UserResponse fetchUserById(String userId) {
        var existing = userRepository.findById(userId);
        if (existing.isPresent()) {
            return userMapper.toUserResponse(existing.get());
        }

        log.warn("User with id {} not found in DB — auto-creating stub record", userId);
        User stub = User.builder()
                .id(userId)
                .firstname(null)
                .lastname(null)
                .email(null)
                .imageUrl(null)
                .build();
        userRepository.save(stub);

        return new UserResponse(userId, null, null, null, null);
    }

    public UserResponse fetchUserByEmail(String userEmail) {
        log.info("Fetching user by email {}", userEmail);
        var user = userRepository.findByEmail(userEmail).orElseThrow(
                () -> new UserNotFoundException(format("User with Email %s is not found", userEmail)));
        return userMapper.toUserResponse(user);
    }

    /**
     * Creates a new user. If a user with the same ID already exists,
     * returns the existing user instead of throwing — making this idempotent.
     */
    @Transactional
    public UserResponse createUser(UserRequestCreate userRequestCreate) {
        log.info("Persisting user with email {} and ID {}", userRequestCreate.email(), userRequestCreate.id());

        var existingUser = userRepository.findById(userRequestCreate.id());
        if (existingUser.isPresent()) {
            log.info("User with ID {} already exists — returning existing record", userRequestCreate.id());
            User existing = existingUser.get();

            // If the existing record is a stub (null fields), fill it in
            boolean updated = false;
            if (existing.getFirstname() == null && userRequestCreate.firstname() != null) {
                existing.setFirstname(userRequestCreate.firstname());
                updated = true;
            }
            if (existing.getLastname() == null && userRequestCreate.lastname() != null) {
                existing.setLastname(userRequestCreate.lastname());
                updated = true;
            }
            if (existing.getEmail() == null && userRequestCreate.email() != null) {
                existing.setEmail(userRequestCreate.email());
                updated = true;
            }
            if (existing.getImageUrl() == null && userRequestCreate.imageUrl() != null) {
                existing.setImageUrl(userRequestCreate.imageUrl());
                updated = true;
            }
            if (updated) {
                userRepository.save(existing);
                log.info("Backfilled stub user record for ID {}", userRequestCreate.id());
            }

            return userMapper.toUserResponse(existing);
        }

        userRepository.save(userMapper.toUser(userRequestCreate));
        return new UserResponse(
                userRequestCreate.id(),
                userRequestCreate.email(),
                userRequestCreate.firstname(),
                userRequestCreate.lastname(),
                userRequestCreate.imageUrl()
        );
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
        if(StringUtils.isNotBlank(newUserInfo.getImageUrl())){
            user.setImageUrl(newUserInfo.getImageUrl());
        } else if (newUserInfo.getImageUrl() == null) {
            user.setImageUrl(null);
        }
    }
}