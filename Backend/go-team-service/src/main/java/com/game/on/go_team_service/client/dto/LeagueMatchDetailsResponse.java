package com.game.on.go_team_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.OffsetDateTime;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LeagueMatchDetailsResponse(
        UUID id,
        String status,
        OffsetDateTime startTime,
        OffsetDateTime endTime
) {
}