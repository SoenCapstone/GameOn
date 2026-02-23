package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateRefereeRegionsRequest(
        @NotEmpty(message = "Regions cannot be empty")
        List<String> allowedRegions
) {}