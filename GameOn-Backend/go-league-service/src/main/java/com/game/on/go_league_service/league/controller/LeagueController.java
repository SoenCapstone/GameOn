package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.auth.CurrentUserProvider;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueDetailResponse;
import com.game.on.go_league_service.league.dto.LeagueListResponse;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueSeasonResponse;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
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
    private final CurrentUserProvider currentUserProvider;

    @PostMapping
    public ResponseEntity<LeagueDetailResponse> createLeague(@Valid @RequestBody LeagueCreateRequest request) {
        var ownerId = currentUserProvider.requireUserId();
        var response = leagueService.createLeague(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<LeagueDetailResponse> getLeague(@PathVariable String identifier) {
        var callerId = currentUserProvider.requireUserId();
        LeagueDetailResponse response;
        try {
            var leagueId = UUID.fromString(identifier);
            response = leagueService.getLeague(leagueId, callerId);
        } catch (IllegalArgumentException ex) {
            response = leagueService.getLeagueBySlug(identifier, callerId);
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
        var callerId = currentUserProvider.requireUserId();
        var criteria = new LeagueSearchCriteria(onlyMine, sport, region, query);
        var response = leagueService.listLeagues(criteria, page, size, callerId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{leagueId}")
    public ResponseEntity<LeagueDetailResponse> updateLeague(@PathVariable UUID leagueId,
                                                             @Valid @RequestBody LeagueUpdateRequest request) {
        var callerId = currentUserProvider.requireUserId();
        var response = leagueService.updateLeague(leagueId, request, callerId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{leagueId}")
    public ResponseEntity<Void> archiveLeague(@PathVariable UUID leagueId) {
        var callerId = currentUserProvider.requireUserId();
        leagueService.archiveLeague(leagueId, callerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{leagueId}/seasons")
    public ResponseEntity<List<LeagueSeasonResponse>> listSeasons(@PathVariable UUID leagueId) {
        var callerId = currentUserProvider.requireUserId();
        var response = leagueService.listSeasons(leagueId, callerId);
        return ResponseEntity.ok(response);
    }
}
