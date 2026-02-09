package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.team.dto.TeamMatchCancelRequest;
import com.game.on.go_team_service.team.dto.TeamMatchCreateRequest;
import com.game.on.go_team_service.team.dto.TeamMatchResponse;
import com.game.on.go_team_service.team.dto.TeamMatchScoreRequest;
import com.game.on.go_team_service.team.service.TeamMatchService;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TeamMatchController {

    private final TeamMatchService teamMatchService;

    @PostMapping("/teams/{teamId}/matches/create-invite")
    public ResponseEntity<TeamMatchResponse> createMatchInvite(@PathVariable UUID teamId,
                                                               @Valid @RequestBody TeamMatchCreateRequest request) {
        var response = teamMatchService.createMatchInvite(teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/teams/{teamId}/matches")
    public ResponseEntity<List<TeamMatchResponse>> listTeamMatches(@PathVariable UUID teamId) {
        return ResponseEntity.ok(teamMatchService.listTeamMatches(teamId));
    }

    @GetMapping("/matches/{matchId}")
    public ResponseEntity<TeamMatchResponse> getMatch(@PathVariable UUID matchId) {
        return ResponseEntity.ok(teamMatchService.getMatch(matchId));
    }

    @PostMapping("/matches/{matchId}/team-invite/accept")
    public ResponseEntity<TeamMatchResponse> acceptTeamInvite(@PathVariable UUID matchId) {
        return ResponseEntity.ok(teamMatchService.acceptInvite(matchId));
    }

    @PostMapping("/matches/{matchId}/team-invite/decline")
    public ResponseEntity<TeamMatchResponse> declineTeamInvite(@PathVariable UUID matchId) {
        return ResponseEntity.ok(teamMatchService.declineInvite(matchId));
    }

    @PostMapping("/matches/{matchId}/cancel")
    public ResponseEntity<TeamMatchResponse> cancelMatch(@PathVariable UUID matchId,
                                                         @Valid @RequestBody(required = false) TeamMatchCancelRequest request) {
        return ResponseEntity.ok(teamMatchService.cancelMatch(matchId, request));
    }

    @PostMapping("/matches/{matchId}/score")
    public ResponseEntity<Void> submitScore(@PathVariable UUID matchId,
                                            @Valid @RequestBody TeamMatchScoreRequest request) {
        teamMatchService.submitScore(matchId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/matches/{matchId}/assign-referee")
    public ResponseEntity<Void> assignReferee(@PathVariable UUID matchId) {
        teamMatchService.assignReferee(matchId);
        return ResponseEntity.noContent().build();
    }
}
