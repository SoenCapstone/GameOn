package com.game.on.go_league_service.league.mapper;

import com.game.on.go_league_service.league.dto.LeagueTeamResponse;
import com.game.on.go_league_service.league.model.LeagueTeam;
import org.springframework.stereotype.Component;

@Component
public class LeagueTeamMapper {

    public LeagueTeamResponse toResponse(LeagueTeam leagueTeam) {
        return new LeagueTeamResponse(
                leagueTeam.getId(),
                leagueTeam.getLeague().getId(),
                leagueTeam.getTeamId(),
                leagueTeam.getCreatedAt()
        );
    }
}
