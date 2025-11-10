package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamPrivacy;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TeamSummaryResponse(
        UUID id,
        String name,
        String sport,
        UUID leagueId,
        String slug,
        String logoUrl,
        TeamPrivacy privacy,
        Integer maxRoster,
        boolean archived,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
