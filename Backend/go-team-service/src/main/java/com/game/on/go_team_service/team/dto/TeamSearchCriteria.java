package com.game.on.go_team_service.team.dto;

import java.util.UUID;

public record TeamSearchCriteria(
        boolean onlyMine,
        UUID leagueId,
        String sport,
        String query
) {
}
