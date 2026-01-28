package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;

import java.time.OffsetDateTime;

public record TeamMemberProfileResponse(
        String userId,
        String email,
        String firstname,
        String lastname,
        TeamRole role,
        TeamMemberStatus status,
        OffsetDateTime joinedAt
) {
}
