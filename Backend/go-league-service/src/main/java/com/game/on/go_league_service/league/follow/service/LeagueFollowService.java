package com.game.on.go_league_service.league.follow.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.follow.dto.LeagueFollowStatusResponse;
import com.game.on.go_league_service.league.follow.dto.MyLeagueFollowingResponse;
import com.game.on.go_league_service.league.follow.model.LeagueFollow;
import com.game.on.go_league_service.league.follow.repository.LeagueFollowRepository;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.repository.LeagueOrganizerRepository;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.service.LeagueService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeagueFollowService {

    private final LeagueService leagueService;
    private final LeagueFollowRepository leagueFollowRepository;
    private final LeagueOrganizerRepository organizerRepository;
    private final LeagueTeamRepository leagueTeamRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public LeagueFollowStatusResponse getFollowStatus(UUID leagueId) {
        requireLeague(leagueId);
        String userId = currentUserProvider.clerkUserId();
        return new LeagueFollowStatusResponse(leagueFollowRepository.existsByLeagueIdAndUserId(leagueId, userId));
    }

    @Transactional(readOnly = true)
    public MyLeagueFollowingResponse listMyFollowingLeagueIds() {
        String userId = currentUserProvider.clerkUserId();
        List<UUID> leagueIds = leagueFollowRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(LeagueFollow::getLeagueId)
                .toList();
        return new MyLeagueFollowingResponse(leagueIds);
    }

    @Transactional
    public void follow(UUID leagueId) {
        String userId = currentUserProvider.clerkUserId();
        League league = requireLeague(leagueId);
        if (league.getPrivacy() != LeaguePrivacy.PUBLIC) {
            throw new ForbiddenException("Only public leagues can be followed");
        }
        if (hasLeagueInsiderAccess(league, userId)) {
            throw new ForbiddenException("League members, owners, and organizers cannot follow this league");
        }
        if (leagueFollowRepository.existsByLeagueIdAndUserId(leagueId, userId)) {
            return;
        }
        LeagueFollow row = LeagueFollow.builder()
                .leagueId(leagueId)
                .userId(userId)
                .build();
        leagueFollowRepository.save(row);
    }

    @Transactional
    public void unfollow(UUID leagueId) {
        String userId = currentUserProvider.clerkUserId();
        requireLeague(leagueId);
        leagueFollowRepository.deleteByLeagueIdAndUserId(leagueId, userId);
    }

    private League requireLeague(UUID leagueId) {
        return leagueService.requireActiveLeague(leagueId);
    }

    /**
     * Owners, organizers, or users with a team registered in the league cannot follow as outsiders.
     */
    private boolean hasLeagueInsiderAccess(League league, String userId) {
        if (league.getOwnerUserId().equals(userId)) {
            return true;
        }
        if (organizerRepository.existsByLeague_IdAndUserId(league.getId(), userId)) {
            return true;
        }
        List<UUID> myTeamIds = leagueService.fetchTeamIdsForUser();
        if (myTeamIds.isEmpty()) {
            return false;
        }
        return leagueTeamRepository.existsByLeague_IdAndTeamIdIn(league.getId(), myTeamIds);
    }
}
