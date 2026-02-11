package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record NodeRefDTO(
        @NotNull UUID id
) {}
