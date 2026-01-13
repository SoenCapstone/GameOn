package com.game.on.go_team_service.team.controller;

import com.game.on.common.dto.UserResponse;
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

    @PostMapping("/create")
    public ResponseEntity<TeamDetailResponse> createTeam(@Valid @RequestBody TeamCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(request));
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
        var criteria = new TeamSearchCriteria(onlyMine, leagueId, sport, query);
        var response = teamService.listTeams(criteria, page, size);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{teamId}")
    public ResponseEntity<TeamDetailResponse> updateTeam(@PathVariable UUID teamId, @Valid @RequestBody TeamUpdateRequest request) {
        return ResponseEntity.ok(teamService.updateTeam(teamId, request));
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Void> archiveTeam(@PathVariable UUID teamId) {
        teamService.archiveTeam(teamId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<UserResponse>> listMembers(@PathVariable UUID teamId) {
        return ResponseEntity.ok(teamService.listMembers(teamId));
    }

    @DeleteMapping("/{teamId}/delete/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID teamId, @PathVariable String userId) {
        teamService.removeMember(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/create-invite")
    public ResponseEntity<TeamInviteResponse> createInvite(@Valid @RequestBody TeamInviteCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createInvite(request));
    }

    @GetMapping("/invites/{teamId}")
    public ResponseEntity<List<TeamInviteResponse>> listTeamInvites(@PathVariable UUID teamId) {
        return ResponseEntity.ok(teamService.listTeamInvites(teamId));
    }

    @GetMapping("/invites")
    public ResponseEntity<List<TeamInviteResponse>> listUserInvites() {
        return ResponseEntity.ok(teamService.listUserTeamInvites());
    }

    @PostMapping("/transfer-owner")
    public ResponseEntity<TeamDetailResponse> transferOwnership(@Valid @RequestBody OwnershipTransferRequest request) {
        return ResponseEntity.ok(teamService.transferOwnership(request));
    }

    @PostMapping("/{teamId}/members/self-demote/{userId}")
    public ResponseEntity<TeamMemberResponse> demoteSelf(@PathVariable String userId, @PathVariable UUID teamId) {
        return ResponseEntity.ok(teamService.demoteSelfToPlayer(teamId, userId));
    }
}
