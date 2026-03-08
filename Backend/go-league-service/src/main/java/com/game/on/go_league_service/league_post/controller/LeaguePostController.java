package com.game.on.go_league_service.league_post.controller;

import com.game.on.go_league_service.league_post.dto.*;
import com.game.on.go_league_service.league_post.service.LeaguePostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leagues/{leagueId}/posts")
@RequiredArgsConstructor
public class LeaguePostController {

    private final LeaguePostService service;

    @PostMapping
    public ResponseEntity<LeaguePostResponse> create(
            @PathVariable UUID leagueId,
            @Valid @RequestBody LeaguePostCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(leagueId, request));
    }

    @GetMapping
    public ResponseEntity<LeaguePostListResponse> list(
            @PathVariable UUID leagueId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.list(leagueId, page, size));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<LeaguePostResponse> get(
            @PathVariable UUID leagueId,
            @PathVariable UUID postId
    ) {
        LeaguePostResponse response = service.get(leagueId, postId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<LeaguePostResponse> update(
            @PathVariable UUID leagueId,
            @PathVariable UUID postId,
            @Valid @RequestBody LeaguePostUpdateRequest request
    ) {
        return ResponseEntity.ok(service.update(leagueId, postId, request));
    }

    @DeleteMapping("/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID leagueId,
            @PathVariable UUID postId
    ) {
        service.delete(leagueId, postId);
    }
}
