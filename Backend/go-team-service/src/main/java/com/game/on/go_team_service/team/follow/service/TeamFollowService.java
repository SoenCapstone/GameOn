package com.game.on.go_team_service.team.follow.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.follow.dto.MyTeamFollowingResponse;
import com.game.on.go_team_service.team.follow.dto.TeamFollowStatusResponse;
import com.game.on.go_team_service.team.follow.model.TeamFollow;
import com.game.on.go_team_service.team.follow.repository.TeamFollowRepository;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamPrivacy;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamFollowService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamFollowRepository teamFollowRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public TeamFollowStatusResponse getFollowStatus(UUID teamId) {
        requireTeam(teamId);
        String userId = currentUserProvider.clerkUserId();
        return new TeamFollowStatusResponse(teamFollowRepository.existsByTeamIdAndUserId(teamId, userId));
    }

    @Transactional(readOnly = true)
    public MyTeamFollowingResponse listMyFollowingTeamIds() {
        String userId = currentUserProvider.clerkUserId();
        List<UUID> teamIds = teamFollowRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(TeamFollow::getTeamId)
                .toList();
        return new MyTeamFollowingResponse(teamIds);
    }

    @Transactional
    public void follow(UUID teamId) {
        String userId = currentUserProvider.clerkUserId();
        Team team = requireTeam(teamId);
        if (team.getPrivacy() != TeamPrivacy.PUBLIC) {
            throw new ForbiddenException("Only public teams can be followed");
        }
        if (isActiveMember(teamId, userId)) {
            throw new ForbiddenException("Team members cannot follow their own team");
        }
        if (teamFollowRepository.existsByTeamIdAndUserId(teamId, userId)) {
            return;
        }
        TeamFollow row = TeamFollow.builder()
                .teamId(teamId)
                .userId(userId)
                .build();
        teamFollowRepository.save(row);
    }

    @Transactional
    public void unfollow(UUID teamId) {
        String userId = currentUserProvider.clerkUserId();
        requireTeam(teamId);
        teamFollowRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    private Team requireTeam(UUID teamId) {
        return teamRepository.findByIdAndDeletedAtIsNull(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
    }

    private boolean isActiveMember(UUID teamId, String userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .filter(member -> member.getStatus() == TeamMemberStatus.ACTIVE)
                .isPresent();
    }
}
