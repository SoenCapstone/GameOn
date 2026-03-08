package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.*;
import com.game.on.go_league_service.league.model.RefereeProfile;
import com.game.on.go_league_service.league.service.RefereeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RefereeController {

    private final RefereeService refereeService;

    @PostMapping("/referees/register")
    public ResponseEntity<RefereeProfileResponse> register(@Valid @RequestBody RefereeRegisterRequest request) {
        var response = refereeService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/referees")
    public ResponseEntity<List<RefereeProfileResponse>> search(@RequestParam(value = "sport", required = false) String sport,
                                                               @RequestParam(value = "region", required = false) String region,
                                                               @RequestParam(value = "active", required = false) Boolean active,
                                                               @RequestParam(value = "matchId", required = false) UUID matchId) {
        return ResponseEntity.ok(refereeService.search(sport, region, active, matchId));
    }

    @PostMapping("/matches/{matchId}/ref-invite")
    public ResponseEntity<RefInviteResponse> createRefInvite(@PathVariable UUID matchId,
                                                             @Valid @RequestBody RefInviteRequest request) {
        var response = refereeService.createRefInvite(matchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/matches/{matchId}/ref-invite/accept")
    public ResponseEntity<RefInviteResponse> acceptRefInvite(@PathVariable UUID matchId) {
        return ResponseEntity.ok(refereeService.acceptRefInvite(matchId));
    }

    @PostMapping("/matches/{matchId}/ref-invite/decline")
    public ResponseEntity<RefInviteResponse> declineRefInvite(@PathVariable UUID matchId) {
        return ResponseEntity.ok(refereeService.declineRefInvite(matchId));
    }

    @GetMapping("/referees/status")
    public ResponseEntity<Map<String, Boolean>> getRefereeStatus() {
        boolean isReferee = refereeService.isReferee();
        boolean isActive = false;

        if (isReferee) {
            isActive = refereeService.isActive();
        }

        Map<String, Boolean> status = Map.of(
                "isReferee", isReferee,
                "isActive", isActive
        );

        return ResponseEntity.ok(status);
    }

    @GetMapping("/referees/profile")
    public ResponseEntity<RefereeProfileResponse> getProfile() {
        RefereeProfileResponse referee = refereeService.getByUserId();

        return ResponseEntity.ok(referee);
    }

    @PutMapping("/referees/sports")
    public ResponseEntity<Void> updateSports(
            @Valid @RequestBody UpdateRefereeSportsRequest request
    ) {
        refereeService.updateSports(request.sports());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/referees/regions")
    public ResponseEntity<Void> updateRegions(
            @Valid @RequestBody UpdateRefereeRegionsRequest request
    ) {
        refereeService.updateRegions(request.allowedRegions());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/referees/status")
    public ResponseEntity<Void> updateStatus(
            @Valid @RequestBody UpdateRefereeStatusRequest request
    ) {
        refereeService.updateStatus(request.isActive());
        return ResponseEntity.noContent().build();
    }

}
