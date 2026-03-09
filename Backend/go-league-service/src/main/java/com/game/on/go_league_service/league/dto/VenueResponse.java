package com.game.on.go_league_service.league.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record VenueResponse(
        UUID id,
        String name,
        String street,
        String city,
        String province,
        String postalCode,
        String country,
        String region,
        Double latitude,
        Double longitude,
        String googlePlaceId,
        String createdByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
