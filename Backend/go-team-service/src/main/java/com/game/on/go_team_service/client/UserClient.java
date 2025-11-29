package com.game.on.go_team_service.client;

import com.game.on.go_user_service.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/* NOTE: This will be used to replace the previous User context in the removed Auth package */
@FeignClient(name = "go-user-service")
public interface UserClient {
    @GetMapping("/user/id/{userId}")
    UserResponse getUserById(@PathVariable String userId);
}
