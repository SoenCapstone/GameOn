package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.RefInviteRequest;
import com.game.on.go_league_service.league.dto.RefInviteResponse;
import com.game.on.go_league_service.league.dto.RefereeProfileResponse;
import com.game.on.go_league_service.league.dto.RefereeRegisterRequest;
import com.game.on.go_league_service.league.service.RefereeService;
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
}
