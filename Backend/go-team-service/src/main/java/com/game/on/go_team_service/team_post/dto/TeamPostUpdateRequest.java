package com.game.on.go_team_service.team_post.dto;

import com.game.on.go_team_service.team_post.model.TeamPostScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TeamPostUpdateRequest(
        @Size(max = 200, message = "title must be at most 120 characters")
        String title,

        @NotBlank(message = "body is required")
        @Size(max = 1000, message = "body must be at most 2000 characters")
        String body,

        @NotNull
        TeamPostScope scope
) {}
