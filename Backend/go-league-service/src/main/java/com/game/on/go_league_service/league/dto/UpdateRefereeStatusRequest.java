package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateRefereeStatusRequest(
        @NotNull Boolean isActive
) {}