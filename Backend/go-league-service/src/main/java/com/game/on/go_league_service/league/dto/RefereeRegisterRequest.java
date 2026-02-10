package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record RefereeRegisterRequest(
        List<@Size(max = 75, message = "sport entries cannot exceed 75 characters") String> sports,
        List<@Size(max = 100, message = "allowedRegions entries cannot exceed 100 characters") String> allowedRegions,
        Boolean isActive
) {
}
