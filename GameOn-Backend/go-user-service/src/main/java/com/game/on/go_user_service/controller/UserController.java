package com.game.on.go_user_service.controller;

import com.game.on.go_user_service.dto.UserRequestCreate;
import com.game.on.go_user_service.dto.UserRequestUpdate;
import com.game.on.go_user_service.dto.UserResponse;
import com.game.on.go_user_service.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/user/getAllUsers")
    public ResponseEntity<List<UserResponse>> getAllUsers(){
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/user/{userEmail}")
    public ResponseEntity<UserResponse> fetchUserByEmail(@PathVariable String userEmail){
        return ResponseEntity.ok(userService.fetchUserByEmail(userEmail));
    }

    @PostMapping("/user/create")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequestCreate userRequestCreate){
        return ResponseEntity.ok(userService.createUser(userRequestCreate));
    }

    @PutMapping("user/update")
    public ResponseEntity<?> updateUser(@Valid @RequestBody UserRequestUpdate userRequestUpdate){
        userService.updateUser(userRequestUpdate);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/user/delete/{userEmail}")
    public ResponseEntity<?> deleteUser(@PathVariable String userEmail){
        userService.deleteUser(userEmail);
        return ResponseEntity.accepted().build();
    }
}
