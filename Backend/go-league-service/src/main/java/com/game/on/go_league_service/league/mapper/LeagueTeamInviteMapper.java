package com.game.on.go_league_service.league.mapper;

import com.game.on.go_league_service.league.dto.LeagueTeamInviteResponse;
import com.game.on.go_league_service.league.model.LeagueTeamInvite;
import org.springframework.stereotype.Component;

@Component
public class LeagueTeamInviteMapper {

    public LeagueTeamInviteResponse toResponse(LeagueTeamInvite invite) {
        return new LeagueTeamInviteResponse(
                invite.getId(),
                invite.getLeague().getId(),
                invite.getTeamId(),
                invite.getInvitedByUserId(),
                invite.getStatus(),
                invite.getCreatedAt(),
                invite.getRespondedAt()
        );
    }
}
