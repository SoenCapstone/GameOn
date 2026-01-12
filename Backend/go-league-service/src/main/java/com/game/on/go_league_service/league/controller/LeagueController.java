package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.*;
import com.game.on.go_league_service.league.model.LeagueMember;
import com.game.on.go_league_service.league.service.LeagueService;
import com.game.on.go_league_service.config.CurrentUserProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leagues")
@RequiredArgsConstructor
public class LeagueController {

    private final LeagueService leagueService;

    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/create")
    public ResponseEntity<LeagueDetailResponse> createLeague(@Valid @RequestBody LeagueCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leagueService.createLeague(request));
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<LeagueDetailResponse> getLeague(@PathVariable String identifier) {
        LeagueDetailResponse response;
        try {
            var leagueId = UUID.fromString(identifier);
            response = leagueService.getLeague(leagueId);
        } catch (IllegalArgumentException ex) {
            response = leagueService.getLeagueBySlug(identifier);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<LeagueListResponse> listLeagues(@RequestParam(value = "my", defaultValue = "false") boolean onlyMine,
                                                          @RequestParam(value = "sport", required = false) String sport,
                                                          @RequestParam(value = "region", required = false) String region,
                                                          @RequestParam(value = "q", required = false) String query,
                                                          @RequestParam(value = "page", defaultValue = "0") int page,
                                                          @RequestParam(value = "size", defaultValue = "20") int size) {
        var criteria = new LeagueSearchCriteria(onlyMine, sport, region, query);
        var response = leagueService.listLeagues(criteria, page, size);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{leagueId}")
    public ResponseEntity<LeagueDetailResponse> updateLeague(@PathVariable UUID leagueId,
                                                             @Valid @RequestBody LeagueUpdateRequest request) {
        return ResponseEntity.ok(leagueService.updateLeague(leagueId, request));
    }

    @DeleteMapping("/{leagueId}")
    public ResponseEntity<Void> archiveLeague(@PathVariable UUID leagueId) {
        leagueService.archiveLeague(leagueId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{leagueId}/seasons")
    public ResponseEntity<List<LeagueSeasonResponse>> listSeasons(@PathVariable UUID leagueId) {
        var response = leagueService.listSeasons(leagueId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{leagueId}/invites")
    public ResponseEntity<Void> createInvite(
            @PathVariable UUID leagueId,
            @Valid @RequestBody LeagueInviteCreateRequest request
    ) {
        var callerId = currentUserProvider.clerkUserId();
        leagueService.createInvite(leagueId, request, callerId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/invites/{inviteId}/respond")
    public ResponseEntity<Void> respondToInvite(
            @Valid @RequestBody LeagueInviteRespondRequest request,
            @PathVariable UUID inviteId
    ) {
        var userId = currentUserProvider.clerkUserId();
        leagueService.respondToInvite(inviteId, userId, request);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{leagueId}/invites")
    public ResponseEntity<List<LeagueInviteResponse>> getInvitesByLeague(@PathVariable UUID leagueId) {
        var callerId = currentUserProvider.clerkUserId();
        return ResponseEntity.ok(leagueService.getInvitesByLeagueId(leagueId, callerId));
    }

    @GetMapping("/invites/users/{email}")
    public ResponseEntity<List<LeagueInviteResponse>> getInvitesForUser(@PathVariable String email) {
        return ResponseEntity.ok(leagueService.getInvitesByEmail(email));
    }

    @GetMapping("/invites/{inviteId}")
    public ResponseEntity<LeagueInviteResponse> getInviteById(@PathVariable UUID inviteId) {
        var response = leagueService.getInviteById(inviteId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{leagueId}/members")
    public ResponseEntity<List<LeagueMember>> getLeagueMembers(
            @PathVariable UUID leagueId
    ) {
        return ResponseEntity.ok(leagueService.getMembersByLeague(leagueId));
    }

    @GetMapping("/memberships")
    public ResponseEntity<List<LeagueMember>> getMyMemberships() {
        var userId = currentUserProvider.clerkUserId();
        return ResponseEntity.ok(leagueService.getMembershipsByUser(userId));
    }

    @GetMapping("/{leagueId}/members/me")
    public ResponseEntity<LeagueMember> getMyMembershipInLeague(
            @PathVariable UUID leagueId
    ) {
        var userId = currentUserProvider.clerkUserId();
        return ResponseEntity.ok(
                leagueService.getMembership(leagueId, userId)
        );
    }


}
