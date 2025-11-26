package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LeagueCreateRequest(
        @NotBlank(message = "name is required")
        @Size(max = 150, message = "name cannot exceed 150 characters")
        String name,
        @NotBlank(message = "sport is required")
        @Size(max = 75, message = "sport cannot exceed 75 characters")
        String sport,
        @Size(max = 120, message = "region cannot exceed 120 characters")
        String region,
        @Size(max = 255, message = "location cannot exceed 255 characters")
        String location,
        LeagueLevel level,
        LeaguePrivacy privacy
) {
}
