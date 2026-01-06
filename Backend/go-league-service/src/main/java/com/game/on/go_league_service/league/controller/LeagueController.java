package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueDetailResponse;
import com.game.on.go_league_service.league.dto.LeagueInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueListResponse;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueSeasonResponse;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.dto.LeagueInviteRespondRequest;
import com.game.on.go_league_service.league.model.LeagueInviteStatus;
import com.game.on.go_league_service.league.service.LeagueService;
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
        var callerId = currentUserProvider.requireUserId();
        leagueService.createInvite(leagueId, request, callerId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/invites/{inviteID}/respond")
    public ResponseEntity<Void> respondToInvite(
            @Valid @RequestBody LeagueInviteRespondRequest request
    ) {
        var userId = currentUserProvider.requireUserId();
        leagueService.respondToInvite(request.id(), userId, request);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{leagueId}/invites")
    public ResponseEntity<List<LeagueInviteRespondRequest>> getInvitesByLeague(@PathVariable UUID leagueId) {
        return ResponseEntity.ok(leagueService.getInvitesByLeagueId(leagueId));
    }

    @GetMapping("/invites/user")
    public ResponseEntity<List<LeagueInviteRespondRequest>> getInvitesForCurrentUser() {
        var userId = currentUserProvider.requireUserId();
        return ResponseEntity.ok(leagueService.getInvitesByUserId(userId));
    }

    @GetMapping("/invites/status")
    public ResponseEntity<List<LeagueInviteRespondRequest>> getInvitesByStatus(
            @RequestParam("status") LeagueInviteStatus status
    ) {
        var userId = currentUserProvider.requireUserId();
        return ResponseEntity.ok(leagueService.getInvitesByStatus(userId, status));
    }

    @GetMapping("/invites/{inviteId}")
    public ResponseEntity<LeagueInviteRespondRequest> getInviteById(@PathVariable UUID inviteId) {
        var response = leagueService.getInviteById(inviteId);
        return ResponseEntity.ok(response);
    }





}
