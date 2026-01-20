package com.game.on.go_league_service.league.controller;

import com.game.on.common.dto.PaymentDTO;
import com.game.on.go_league_service.kafka.PaymentProducer;
import com.game.on.go_league_service.league.dto.*;
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
    /* Temporary placement of the Kafka producer class */
    private final PaymentProducer paymentProducer;

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

    @GetMapping("/{leagueId}/teams")
    public ResponseEntity<List<LeagueTeamResponse>> listLeagueTeams(@PathVariable UUID leagueId) {
        var response = leagueService.listLeagueTeams(leagueId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{leagueId}/teams/{teamId}")
    public ResponseEntity<Void> removeTeamFromLeague(@PathVariable UUID leagueId,
                                                     @PathVariable UUID teamId) {
        leagueService.removeTeamFromLeague(leagueId, teamId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{leagueId}/seasons")
    public ResponseEntity<LeagueSeasonResponse> createSeason(@PathVariable UUID leagueId,
                                                             @Valid @RequestBody LeagueSeasonCreateRequest request) {
        var response = leagueService.createSeason(leagueId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{leagueId}/seasons/{seasonId}")
    public ResponseEntity<LeagueSeasonResponse> getSeason(@PathVariable UUID leagueId,
                                                          @PathVariable UUID seasonId) {
        var response = leagueService.getSeason(leagueId, seasonId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{leagueId}/seasons/{seasonId}")
    public ResponseEntity<LeagueSeasonResponse> updateSeason(@PathVariable UUID leagueId,
                                                             @PathVariable UUID seasonId,
                                                             @Valid @RequestBody LeagueSeasonUpdateRequest request) {
        var response = leagueService.updateSeason(leagueId, seasonId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{leagueId}/seasons/{seasonId}")
    public ResponseEntity<Void> archiveSeason(@PathVariable UUID leagueId,
                                              @PathVariable UUID seasonId) {
        leagueService.archiveSeason(leagueId, seasonId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{leagueId}/seasons/{seasonId}/restore")
    public ResponseEntity<LeagueSeasonResponse> restoreSeason(@PathVariable UUID leagueId,
                                                              @PathVariable UUID seasonId) {
        var response = leagueService.restoreSeason(leagueId, seasonId);
        return ResponseEntity.ok(response);
    }

    /* Test endpoint... TO DO: remove once Payment/ stripe is implemented */
    @PostMapping("/payment-event")
    public void producePaymentEvent(@RequestBody PaymentDTO paymentDTO) {
        paymentProducer.sendEvent("go-payment", paymentDTO);
    }
}
