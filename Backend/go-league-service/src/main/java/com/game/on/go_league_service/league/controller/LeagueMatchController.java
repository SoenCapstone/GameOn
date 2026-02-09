package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.AssignRefereeRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchCancelRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchResponse;
import com.game.on.go_league_service.league.dto.LeagueMatchScoreRequest;
import com.game.on.go_league_service.league.service.LeagueMatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leagues")
@RequiredArgsConstructor
public class LeagueMatchController {

    private final LeagueMatchService leagueMatchService;

    @PostMapping("/{leagueId}/matches/create-match")
    public ResponseEntity<LeagueMatchResponse> createMatch(@PathVariable UUID leagueId,
                                                           @Valid @RequestBody LeagueMatchCreateRequest request) {
        var response = leagueMatchService.createMatch(leagueId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{leagueId}/matches")
    public ResponseEntity<List<LeagueMatchResponse>> listMatches(@PathVariable UUID leagueId) {
        return ResponseEntity.ok(leagueMatchService.listMatches(leagueId));
    }

    @PostMapping("/{leagueId}/matches/{matchId}/cancel")
    public ResponseEntity<LeagueMatchResponse> cancelMatch(@PathVariable UUID leagueId,
                                                           @PathVariable UUID matchId,
                                                           @Valid @RequestBody(required = false) LeagueMatchCancelRequest request) {
        return ResponseEntity.ok(leagueMatchService.cancelMatch(leagueId, matchId, request));
    }

    @PostMapping("/{leagueId}/matches/{matchId}/score")
    public ResponseEntity<Void> submitScore(@PathVariable UUID leagueId,
                                            @PathVariable UUID matchId,
                                            @Valid @RequestBody LeagueMatchScoreRequest request) {
        leagueMatchService.submitScore(leagueId, matchId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{leagueId}/matches/{matchId}/assign-referee")
    public ResponseEntity<LeagueMatchResponse> assignReferee(@PathVariable UUID leagueId,
                                                             @PathVariable UUID matchId,
                                                             @Valid @RequestBody AssignRefereeRequest request) {
        return ResponseEntity.ok(leagueMatchService.assignReferee(leagueId, matchId, request));
    }
}
