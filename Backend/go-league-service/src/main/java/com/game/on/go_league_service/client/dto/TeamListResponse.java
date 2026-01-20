package com.game.on.go_league_service.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TeamListResponse(
        List<TeamListItem> items
) {
}
