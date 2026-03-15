package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record VenueCreateRequest(
        @NotBlank(message = "name is required")
        @Size(max = 200, message = "name cannot exceed 200 characters")
        String name,
        @NotBlank(message = "street is required")
        @Size(max = 255, message = "street cannot exceed 255 characters")
        String street,
        @NotBlank(message = "city is required")
        @Size(max = 120, message = "city cannot exceed 120 characters")
        String city,
        @NotBlank(message = "province is required")
        @Size(max = 120, message = "province cannot exceed 120 characters")
        String province,
        @NotBlank(message = "postalCode is required")
        @Size(max = 20, message = "postalCode cannot exceed 20 characters")
        String postalCode,
        @Size(max = 120, message = "country cannot exceed 120 characters")
        String country,
        @Size(max = 120, message = "region cannot exceed 120 characters")
        String region,
        Double latitude,
        Double longitude,
        @Size(max = 255, message = "googlePlaceId cannot exceed 255 characters")
        String googlePlaceId,
        UUID homeTeamId,
        UUID awayTeamId
) {
}
