package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.team.dto.VenueCreateRequest;
import com.game.on.go_team_service.team.dto.VenueResponse;
import com.game.on.go_team_service.team.service.VenueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @PostMapping
    public ResponseEntity<VenueResponse> createVenue(@Valid @RequestBody VenueCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(venueService.createVenue(request));
    }

    @GetMapping
    public ResponseEntity<List<VenueResponse>> listVenues(
            @RequestParam(value = "homeTeamId", required = false) UUID homeTeamId,
            @RequestParam(value = "awayTeamId", required = false) UUID awayTeamId
    ) {
        return ResponseEntity.ok(venueService.listVenues(homeTeamId, awayTeamId));
    }

    @GetMapping("/{venueId}")
    public ResponseEntity<VenueResponse> getVenue(@PathVariable UUID venueId) {
        return ResponseEntity.ok(venueService.getVenue(venueId));
    }
}
