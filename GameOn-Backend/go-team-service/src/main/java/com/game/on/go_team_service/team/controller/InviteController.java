package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.auth.CurrentUserProvider;
import com.game.on.go_team_service.team.dto.TeamMemberResponse;
import com.game.on.go_team_service.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/invites")
@RequiredArgsConstructor
public class InviteController {

    private final TeamService teamService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<TeamMemberResponse> acceptInvite(@PathVariable UUID inviteId) {
        var userId = currentUserProvider.requireUserId();
        var response = teamService.acceptInvite(inviteId, userId, currentUserProvider.currentEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{inviteId}/decline")
    public ResponseEntity<Void> declineInvite(@PathVariable UUID inviteId) {
        var userId = currentUserProvider.requireUserId();
        teamService.declineInvite(inviteId, userId, currentUserProvider.currentEmail());
        return ResponseEntity.noContent().build();
    }
}
