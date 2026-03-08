package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpdateRefereeSportsRequest(
        @NotEmpty(message = "Sports cannot be empty")
        List<String> sports
) {}
