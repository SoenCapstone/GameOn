package com.game.on.go_league_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.OffsetDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamMatchDetailResponse(
        UUID id,
        String matchType,
        String status,
        UUID homeTeamId,
        UUID awayTeamId,
        String sport,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        String matchLocation,
        Boolean requiresReferee,
        String refereeUserId,
        String createdByUserId
) {
}
