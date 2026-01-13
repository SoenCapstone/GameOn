package com.game.on.go_league_service.league.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang.StringUtils;

import java.time.LocalDate;

@Getter
@Setter
public class LeagueSeasonCreateRequest {
    @NotBlank
    @Size(max = 150)
    private String name;

    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
}
