package com.game.on.go_league_service.league.controller;

import com.game.on.go_league_service.league.dto.LeagueOrganizerInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueOrganizerResponse;
import com.game.on.go_league_service.league.service.LeagueOrganizerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LeagueOrganizerController {

    private final LeagueOrganizerService organizerService;

    @GetMapping("/leagues/{leagueId}/organizers")
    public ResponseEntity<List<LeagueOrganizerResponse>> list(@PathVariable UUID leagueId) {
        return ResponseEntity.ok(organizerService.listOrganizers(leagueId));
    }

    @DeleteMapping("/leagues/{leagueId}/organizers/{userId}")
    public ResponseEntity<Void> remove(@PathVariable UUID leagueId,
                                       @PathVariable String userId) {
        organizerService.removeOrganizer(leagueId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/leagues/{leagueId}/organizer-invites")
    public ResponseEntity<Void> invite(@PathVariable UUID leagueId,
                                       @Valid @RequestBody LeagueOrganizerInviteCreateRequest request) {
        organizerService.createInvite(leagueId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/leagues/{leagueId}/organizer-invites/pending-ids")
    public ResponseEntity<List<String>> pendingIds(@PathVariable UUID leagueId) {
        return ResponseEntity.ok(organizerService.listPendingInviteeIds(leagueId));
    }

    @PostMapping("/league-organizer-invites/{inviteId}/accept")
    public ResponseEntity<Void> accept(@PathVariable UUID inviteId) {
        organizerService.acceptInvite(inviteId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/league-organizer-invites/{inviteId}/decline")
    public ResponseEntity<Void> decline(@PathVariable UUID inviteId) {
        organizerService.declineInvite(inviteId);
        return ResponseEntity.noContent().build();
    }
}