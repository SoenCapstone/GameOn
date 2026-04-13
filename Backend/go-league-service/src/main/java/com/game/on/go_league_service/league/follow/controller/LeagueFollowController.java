package com.game.on.go_league_service.league.follow.controller;

import com.game.on.go_league_service.league.follow.dto.LeagueFollowStatusResponse;
import com.game.on.go_league_service.league.follow.dto.MyLeagueFollowingResponse;
import com.game.on.go_league_service.league.follow.service.LeagueFollowService;
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
@RequestMapping("/api/v1/leagues")
@RequiredArgsConstructor
public class LeagueFollowController {

    private final LeagueFollowService leagueFollowService;

    @GetMapping("/me/following")
    public ResponseEntity<MyLeagueFollowingResponse> listMyFollowing() {
        return ResponseEntity.ok(leagueFollowService.listMyFollowingLeagueIds());
    }

    @GetMapping("/{leagueId}/follow")
    public ResponseEntity<LeagueFollowStatusResponse> getFollowStatus(@PathVariable UUID leagueId) {
        return ResponseEntity.ok(leagueFollowService.getFollowStatus(leagueId));
    }

    @PostMapping("/{leagueId}/follow")
    public ResponseEntity<Void> follow(@PathVariable UUID leagueId) {
        leagueFollowService.follow(leagueId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{leagueId}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable UUID leagueId) {
        leagueFollowService.unfollow(leagueId);
        return ResponseEntity.noContent().build();
    }
}
