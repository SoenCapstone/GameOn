package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.team.dto.ExploreMatchesRequest;
import com.game.on.go_team_service.team.dto.TeamMatchResponse;
import com.game.on.go_team_service.team.service.ExploreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/explore")
@RequiredArgsConstructor
public class ExploreController {

    private final ExploreService exploreService;

    @PostMapping("/team-matches")
    public ResponseEntity<List<TeamMatchResponse>> listUpcomingPublicTeamMatches(
            @Valid @RequestBody ExploreMatchesRequest request) {
        return ResponseEntity.ok(exploreService.listUpcomingPublicTeamMatches(request));
    }
}
