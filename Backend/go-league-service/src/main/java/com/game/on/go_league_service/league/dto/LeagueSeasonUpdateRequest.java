package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class LeagueSeasonUpdateRequest {
    @Size(max = 150)
    private String name;

    private LocalDate startDate;
    private LocalDate endDate;
}
