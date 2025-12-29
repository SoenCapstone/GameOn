package com.game.on.go_team_service.client;

import com.game.on.go_team_service.config.FeignAuthForwardingConfig;
import com.game.on.common.dto.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "go-user-service",
        configuration = FeignAuthForwardingConfig.class
)
public interface UserClient {
    @GetMapping("/api/v1/user/id/{userId}")
    UserResponse getUserById(@PathVariable String userId);
}
