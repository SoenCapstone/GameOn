package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;

import java.time.OffsetDateTime;

public record TeamMemberResponse(
        Long userId,
        TeamRole role,
        TeamMemberStatus status,
        OffsetDateTime joinedAt
) {
}
