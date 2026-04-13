package com.game.on.go_league_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamMatchDetailResponse(
        UUID id,
        String matchType,
        String status,
        UUID homeTeamId,
        UUID awayTeamId,
        Integer homeScore,
        Integer awayScore,
        String sport,
        OffsetDateTime startTime,
        OffsetDateTime endTime,
        LocalDate scheduledDate,
        String matchLocation,
        UUID venueId,
        Boolean requiresReferee,
        String refereeUserId,
        String notes,
        String createdByUserId,
        String cancelledByUserId,
        String cancelReason,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
