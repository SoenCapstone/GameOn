package com.game.on.go_team_service.team_announcement.controller;

import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementCreateRequest;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementListResponse;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementResponse;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementUpdateRequest;
import com.game.on.go_team_service.team_announcement.service.TeamAnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/teams/{teamId}/announcements")
@RequiredArgsConstructor
public class TeamAnnouncementController {

    private final TeamAnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<TeamAnnouncementResponse> create(
            @PathVariable UUID teamId,
            @Valid @RequestBody TeamAnnouncementCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(announcementService.create(teamId, request));
    }

    @GetMapping
    public ResponseEntity<TeamAnnouncementListResponse> list(
            @PathVariable UUID teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(announcementService.list(teamId, page, size));
    }

    @GetMapping("/{announcementId}")
    public ResponseEntity<TeamAnnouncementResponse> get(
            @PathVariable UUID teamId,
            @PathVariable UUID announcementId
    ) {
        TeamAnnouncementResponse response = announcementService.get(teamId, announcementId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{announcementId}")
    public ResponseEntity<TeamAnnouncementResponse> update(
            @PathVariable UUID teamId,
            @PathVariable UUID announcementId,
            @Valid @RequestBody TeamAnnouncementUpdateRequest request
    ) {
        return ResponseEntity.ok(announcementService.update(teamId, announcementId, request));
    }

    @DeleteMapping("/{announcementId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable UUID teamId,
            @PathVariable UUID announcementId
    ) {
        announcementService.delete(teamId, announcementId);
    }
}
