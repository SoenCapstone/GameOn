package com.game.on.go_team_service.team_announcement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record TeamAnnouncementCreateRequest(
        @Size(max = 120, message = "title must be at most 120 characters")
        String title,

        UUID teamId,

        @NotBlank(message = "content is required")
        @Size(max = 2000, message = "content must be at most 2000 characters")
        String content
) {}
