package com.game.on.go_team_service.team.mapper;

import com.game.on.go_team_service.team.dto.TeamDetailResponse;
import com.game.on.go_team_service.team.dto.TeamInviteResponse;
import com.game.on.go_team_service.team.dto.TeamMemberResponse;
import com.game.on.go_team_service.team.dto.TeamSummaryResponse;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamInvite;
import com.game.on.go_team_service.team.model.TeamMember;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TeamMapper {

    public TeamDetailResponse toDetail(Team team, List<TeamMember> members) {
        return new TeamDetailResponse(
                team.getId(),
                team.getName(),
                team.getSport(),
//                team.getLeagueId(),
                team.getScope(),
                team.getOwnerUserId(),
                team.getSlug(),
                team.getLogoUrl(),
                team.getLocation(),
//                team.getMaxRoster(),
                team.getPrivacy(),
                team.isArchived(),
                team.getCreatedAt(),
                team.getUpdatedAt(),
                members.stream().map(this::toMember).toList()
        );
    }

    public TeamSummaryResponse toSummary(Team team) {
        return new TeamSummaryResponse(
                team.getId(),
                team.getName(),
                team.getSport(),
//                team.getLeagueId(),
                team.getSlug(),
                team.getLogoUrl(),
                team.getPrivacy(),
//                team.getMaxRoster(),
                team.isArchived(),
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }

    public TeamMemberResponse toMember(TeamMember member) {
        return new TeamMemberResponse(
                member.getUserId(),
                member.getRole(),
                member.getStatus(),
                member.getJoinedAt()
        );
    }

    public TeamInviteResponse toInviteResponse(TeamInvite invite) {
        return new TeamInviteResponse(
                invite.getId(),
                invite.getTeam().getId(),
                invite.getInvitedByUserId(),
                invite.getInviteeUserId(),
                invite.getInviteeEmail(),
                invite.getStatus(),
                invite.getCreatedAt(),
                invite.getUpdatedAt(),
                invite.getExpiresAt(),
                invite.getRespondedAt()
        );
    }
}
