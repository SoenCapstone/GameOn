package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import jakarta.validation.constraints.Size;

public record LeagueUpdateRequest(
        @Size(max = 150, message = "name cannot exceed 150 characters")
        String name,
        @Size(max = 75, message = "sport cannot exceed 75 characters")
        String sport,
        @Size(max = 120, message = "region cannot exceed 120 characters")
        String region,
        @Size(max = 255, message = "location cannot exceed 255 characters")
        String location,
        @Size(max = 350, message = "logoUrl cannot exceed 350 characters")
        String logoUrl,
        LeagueLevel level,
        LeaguePrivacy privacy
) {
}
