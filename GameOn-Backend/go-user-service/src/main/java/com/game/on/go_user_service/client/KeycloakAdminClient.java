package com.game.on.go_user_service.client;

import com.game.on.go_user_service.model.KeycloakUser;
import feign.Response;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(
        name = "keycloak-admin",
        url = "${keycloak.base-url}/admin/realms/${keycloak.realm}",
        configuration = com.game.on.go_user_service.config.KeycloakFeignOAuth2Config.class
)
public interface KeycloakAdminClient {

    @GetMapping("/users")
    List<Map<String, Object>> getAllUsers(@RequestParam(value = "first", defaultValue = "0") int first,
            @RequestParam(value = "max", defaultValue = "100") int max
    );

    @GetMapping("/users/{id}")
    Map<String, Object> getUser(@PathVariable String id);

    @GetMapping("/users")
    List<Map<String, Object>> findUserByEmail(@RequestParam("email") String email,
                                              @RequestParam(value = "exact", defaultValue = "true") boolean exact,
                                              @RequestParam(value = "first", defaultValue = "0") Integer first
    );

    @PostMapping("/users")
    Response createUser(@RequestBody KeycloakUser keycloakUser);

    @PutMapping("/users/{id}")
    void updateUser(@PathVariable String id, @RequestBody Map<String, Object> body);

    @DeleteMapping("/users/{id}")
    void deleteUser(@PathVariable String id);
}

