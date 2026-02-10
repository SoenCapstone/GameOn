package com.game.on.go_league_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamSummaryResponse(
        UUID id,
        String sport,
        List<String> allowedRegions,
        String ownerUserId
) {
}
