package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamPrivacy;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record TeamDetailResponse(
        UUID id,
        String name,
        String sport,
//        UUID leagueId,
        String scope,
        Long ownerUserId,
        String slug,
        String logoUrl,
        String location,
//        Integer maxRoster,
        TeamPrivacy privacy,
        boolean archived,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<TeamMemberResponse> members
) {
}
