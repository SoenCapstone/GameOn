package com.game.on.go_league_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamSummaryResponse(
        UUID id,
        String sport,
        List<String> allowedRegions,
        String ownerUserId,
        String name,
        String logoUrl
) {
    // Backward-compatible constructor used by existing call sites (defaults name to null)
    public TeamSummaryResponse(UUID id, String sport, List<String> allowedRegions, String ownerUserId) {
        this(id, sport, allowedRegions, ownerUserId, null, null);
    }

    public static TeamSummaryResponse withName(UUID id, String sport, List<String> allowedRegions, String ownerUserId, String name, String logoUrl) {
        return new TeamSummaryResponse(id, sport, allowedRegions, ownerUserId, name, logoUrl);
    }
}
