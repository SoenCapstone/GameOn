package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PersonNodeDTO(

        @NotNull
        UUID id,

        @NotNull
        Double x,

        @NotNull
        Double y,

        @NotNull
        Double size,

        String associatedPlayerId

) implements PlayItemDTO {}

