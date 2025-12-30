package com.game.on.go_user_service.mapper;

import com.game.on.go_user_service.dto.UserRequest;

import com.game.on.common.dto.UserResponse;
import com.game.on.go_user_service.model.User;
import org.springframework.stereotype.Component;


@Component
public class UserMapper {

    public User toUser(UserRequest userRequest) {
       return User.builder()
               .id(userRequest.id())
               .firstname(userRequest.firstname())
               .lastname(userRequest.lastname())
               .email(userRequest.email())
               .build();
    }

    public UserResponse toUserResponse(User user){
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstname(), user.getLastname());
    }
}
