package com.game.on.go_team_service.team.follow.controller;

import com.game.on.go_team_service.team.follow.dto.MyTeamFollowingResponse;
import com.game.on.go_team_service.team.follow.dto.TeamFollowStatusResponse;
import com.game.on.go_team_service.team.follow.service.TeamFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamFollowController {

    private final TeamFollowService teamFollowService;

    @GetMapping("/me/following")
    public ResponseEntity<MyTeamFollowingResponse> listMyFollowing() {
        return ResponseEntity.ok(teamFollowService.listMyFollowingTeamIds());
    }

    @GetMapping("/{teamId}/follow")
    public ResponseEntity<TeamFollowStatusResponse> getFollowStatus(@PathVariable UUID teamId) {
        return ResponseEntity.ok(teamFollowService.getFollowStatus(teamId));
    }

    @PostMapping("/{teamId}/follow")
    public ResponseEntity<Void> follow(@PathVariable UUID teamId) {
        teamFollowService.follow(teamId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{teamId}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable UUID teamId) {
        teamFollowService.unfollow(teamId);
        return ResponseEntity.noContent().build();
    }
}
