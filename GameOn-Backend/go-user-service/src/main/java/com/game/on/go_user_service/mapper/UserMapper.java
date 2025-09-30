package com.game.on.go_user_service.mapper;

import com.game.on.go_user_service.dto.UserRequest;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toUserResponse(User user){
        return new UserResponse(user.getFirstname(), user.getLastname(), user.getEmail());
    }

    public User toUser(UserRequest userRequest){
        return User.builder()
                .firstname(userRequest.firstname())
                .lastname(userRequest.lastname())
                .email(userRequest.email())
                .password(userRequest.password())
                .build();
    }
}
