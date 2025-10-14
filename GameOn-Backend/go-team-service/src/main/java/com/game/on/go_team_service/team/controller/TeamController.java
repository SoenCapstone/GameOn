package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.auth.CurrentUserProvider;
import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping
    public ResponseEntity<TeamDetailResponse> createTeam(@Valid @RequestBody TeamCreateRequest request) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.createTeam(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<TeamDetailResponse> getTeam(@PathVariable String identifier) {
        TeamDetailResponse response;
        try {
            var teamId = UUID.fromString(identifier);
            response = teamService.getTeam(teamId);
        } catch (IllegalArgumentException ex) {
            response = teamService.getTeamBySlug(identifier);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<TeamListResponse> listTeams(@RequestParam(value = "my", defaultValue = "false") boolean onlyMine,
                                                      @RequestParam(value = "leagueId", required = false) UUID leagueId,
                                                      @RequestParam(value = "sport", required = false) String sport,
                                                      @RequestParam(value = "q", required = false) String query,
                                                      @RequestParam(value = "page", defaultValue = "0") int page,
                                                      @RequestParam(value = "size", defaultValue = "20") int size) {
        var userId = currentUserProvider.requireUserId();
        var criteria = new TeamSearchCriteria(onlyMine, leagueId, sport, query);
        var response = teamService.listTeams(criteria, page, size, userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{teamId}")
    public ResponseEntity<TeamDetailResponse> updateTeam(@PathVariable UUID teamId,
                                                         @Valid @RequestBody TeamUpdateRequest request) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.updateTeam(teamId, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Void> archiveTeam(@PathVariable UUID teamId) {
        var userId = currentUserProvider.requireUserId();
        teamService.archiveTeam(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberResponse>> listMembers(@PathVariable UUID teamId) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.listMembers(teamId, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{teamId}/members/{memberUserId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID teamId,
                                             @PathVariable Long memberUserId) {
        var userId = currentUserProvider.requireUserId();
        teamService.removeMember(teamId, memberUserId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{teamId}/invites")
    public ResponseEntity<TeamInviteResponse> createInvite(@PathVariable UUID teamId,
                                                           @Valid @RequestBody TeamInviteCreateRequest request) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.createInvite(teamId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{teamId}/invites")
    public ResponseEntity<List<TeamInviteResponse>> listInvites(@PathVariable UUID teamId) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.listInvites(teamId, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{teamId}/transfer-owner")
    public ResponseEntity<TeamDetailResponse> transferOwnership(@PathVariable UUID teamId,
                                                                @Valid @RequestBody OwnershipTransferRequest request) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.transferOwnership(teamId, request.newOwnerUserId(), userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{teamId}/members/self-demote")
    public ResponseEntity<TeamMemberResponse> demoteSelf(@PathVariable UUID teamId) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.demoteSelfToPlayer(teamId, userId);
        return ResponseEntity.ok(response);
    }
}
