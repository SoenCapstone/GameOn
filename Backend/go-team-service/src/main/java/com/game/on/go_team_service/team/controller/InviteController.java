package com.game.on.go_team_service.team.controller;

import com.game.on.go_team_service.team.dto.TeamInvitationReply;
import com.game.on.go_team_service.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invites")
@RequiredArgsConstructor
public class InviteController {

    private final TeamService teamService;

    @PostMapping("/response")
    public ResponseEntity<Void> respondToInvite(@Valid @RequestBody TeamInvitationReply reply) {
        if(reply.isAccepted()){
            teamService.acceptInvite(reply);
            return ResponseEntity.ok().build();
        }
        teamService.declineInvite(reply);
        return ResponseEntity.noContent().build();
    }
}
