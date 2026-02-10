package com.game.on.go_team_service.team.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({@JsonSubTypes.Type(value = PersonNodeDTO.class, name = "person"),
        @JsonSubTypes.Type(value = ArrowDTO.class, name = "arrow")})
public sealed interface PlayItemDTO permits PersonNodeDTO, ArrowDTO {

}
