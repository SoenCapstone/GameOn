package com.game.on.go_league_service.client.dto;

import java.time.OffsetDateTime;

public record TeamMemberProfileResponse(
        String userId,
        String email,
        String firstname,
        String lastname,
        String imageUrl,
        String role,
        String status,
        OffsetDateTime joinedAt
) {}