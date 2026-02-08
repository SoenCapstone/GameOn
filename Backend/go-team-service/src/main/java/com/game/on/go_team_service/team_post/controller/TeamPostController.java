package com.game.on.go_team_service.team_post.controller;

import com.game.on.go_team_service.team_post.dto.TeamPostCreateRequest;
import com.game.on.go_team_service.team_post.dto.TeamPostListResponse;
import com.game.on.go_team_service.team_post.dto.TeamPostResponse;
import com.game.on.go_team_service.team_post.dto.TeamPostUpdateRequest;
import com.game.on.go_team_service.team_post.service.TeamPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/posts")
@RequiredArgsConstructor
public class TeamPostController {

    private final TeamPostService postService;

    @PostMapping
    public ResponseEntity<TeamPostResponse> create(
            @PathVariable UUID teamId,
            @Valid @RequestBody TeamPostCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.create(teamId, request));
    }

    @GetMapping
    public ResponseEntity<TeamPostListResponse> list(
            @PathVariable UUID teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(postService.list(teamId, page, size));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<TeamPostResponse> get(
            @PathVariable UUID teamId,
            @PathVariable UUID postId
    ) {
        TeamPostResponse response = postService.get(teamId, postId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<TeamPostResponse> update(
            @PathVariable UUID teamId,
            @PathVariable UUID postId,
            @Valid @RequestBody TeamPostUpdateRequest request
    ) {
        return ResponseEntity.ok(postService.update(teamId, postId, request));
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID teamId,
            @PathVariable UUID postId
    ) {
        postService.delete(teamId, postId);
    }
}
