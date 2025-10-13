package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.TeamPrivacy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TeamCreateRequest(
        @NotBlank(message = "name is required")
        @Size(max = 150, message = "name cannot exceed 150 characters")
        String name,
        @Size(max = 75, message = "sport cannot exceed 75 characters")
        String sport,
        UUID leagueId,
        @Size(max = 255, message = "logoUrl cannot exceed 255 characters")
        String logoUrl,
        @Size(max = 255, message = "location cannot exceed 255 characters")
        String location,
        @Positive(message = "maxRoster must be greater than 0")
        Integer maxRoster,
        TeamPrivacy privacy
) {
}
