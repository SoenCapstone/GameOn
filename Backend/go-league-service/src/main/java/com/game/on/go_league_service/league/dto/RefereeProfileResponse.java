package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record RefereeProfileResponse(
        String userId,
        List<String> sports,
        List<String> allowedRegions,
        boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
