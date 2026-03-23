package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.AttendanceStatus;
import com.game.on.go_team_service.team.model.TeamRole;

import java.util.UUID;

public record TeamMatchMemberResponse(
        UUID id,
        UUID teamId,
        String userId,
        TeamRole role,
        AttendanceStatus status
        ) {
}
