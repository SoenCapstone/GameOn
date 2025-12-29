package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueInvite;
import com.game.on.go_league_service.league.model.LeagueInviteStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueInviteRepository extends JpaRepository<LeagueInvite, UUID> {

    List<LeagueInvite> findByInviteeUserIdAndAcceptedAtIsNull(String userId);

    Optional<LeagueInvite> findByLeagueIdAndInviteeUserId(UUID leagueId, String userId);

    Optional<LeagueInvite> findByIdAndStatus(UUID id, LeagueInviteStatus status);

    

}
