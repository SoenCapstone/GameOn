package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.ExploreMatchesRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchResponse;
import com.game.on.go_league_service.league.service.ExploreService;
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

    @PostMapping("/league-matches")
    public ResponseEntity<List<LeagueMatchResponse>> listUpcomingPublicLeagueMatches(
            @Valid @RequestBody ExploreMatchesRequest request) {
        return ResponseEntity.ok(exploreService.listUpcomingPublicLeagueMatches(request));
    }
}
