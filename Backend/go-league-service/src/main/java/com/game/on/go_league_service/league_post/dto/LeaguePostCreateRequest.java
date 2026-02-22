package com.game.on.go_league_service.league_post.dto;

import com.game.on.go_league_service.league_post.model.LeaguePostScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


public record LeaguePostCreateRequest(
        @Size(min = 1, max = 200, message = "title must be at most 120 characters")
        String title,

        @NotBlank(message = "body is required")
        @Size(min = 1, max = 1000, message = "body must be at most 2000 characters")
        String body,

        @NotNull
        LeaguePostScope scope
) {}
