package com.game.on.go_team_service.team.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ArrowDTO(

        @NotNull
        UUID id,

        @NotNull
        @jakarta.validation.Valid
        NodeRefDTO from,

        @NotNull
        @jakarta.validation.Valid
        NodeRefDTO to

) implements PlayItemDTO {
}
