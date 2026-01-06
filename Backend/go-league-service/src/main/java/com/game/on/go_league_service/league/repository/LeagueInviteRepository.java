package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueInvite;
import com.game.on.go_league_service.league.model.LeagueInviteStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueInviteRepository extends JpaRepository<LeagueInvite, UUID> {

    Optional<LeagueInvite> findByLeagueIdAndInviteeEmail(UUID leagueId, String email);

    Optional<LeagueInvite> findByInviteId(UUID id);

    List<LeagueInvite> findByLeagueId(UUID leagueId);

    List<LeagueInvite> findByInviteeUserId(Long inviteeUserId);

    List<LeagueInvite> findByInviteeUserIdAndStatus(Long inviteeUserId, LeagueInviteStatus status);



}
