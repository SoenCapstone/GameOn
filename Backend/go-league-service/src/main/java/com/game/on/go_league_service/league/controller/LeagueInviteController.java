package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.LeagueTeamInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueTeamInviteResponse;
import com.game.on.go_league_service.league.service.LeagueInviteService;
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
public class LeagueInviteController {

    private final LeagueInviteService leagueInviteService;

    @PostMapping("/leagues/{leagueId}/invites")
    public ResponseEntity<LeagueTeamInviteResponse> createInvite(@PathVariable UUID leagueId,
                                                                 @Valid @RequestBody LeagueTeamInviteCreateRequest request) {
        var response = leagueInviteService.createInvite(leagueId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/teams/{teamId}/league-invites")
    public ResponseEntity<List<LeagueTeamInviteResponse>> listTeamInvites(@PathVariable UUID teamId) {
        return ResponseEntity.ok(leagueInviteService.listInvitesForTeam(teamId));
    }

    @PostMapping("/league-invites/{inviteId}/accept")
    public ResponseEntity<LeagueTeamInviteResponse> acceptInvite(@PathVariable UUID inviteId) {
        return ResponseEntity.ok(leagueInviteService.acceptInvite(inviteId));
    }

    @PostMapping("/league-invites/{inviteId}/decline")
    public ResponseEntity<Void> declineInvite(@PathVariable UUID inviteId) {
        leagueInviteService.declineInvite(inviteId);
        return ResponseEntity.noContent().build();
    }
}
