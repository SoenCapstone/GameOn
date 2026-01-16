package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamRole;

public record TeamMemberProfileResponse(
        String userId,
        String email,
        String firstname,
        String lastname,
        TeamRole role
) {
}
