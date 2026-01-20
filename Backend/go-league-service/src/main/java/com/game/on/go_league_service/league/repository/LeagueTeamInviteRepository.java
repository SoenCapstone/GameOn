package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueTeamInvite;
import com.game.on.go_league_service.league.model.LeagueTeamInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueTeamInviteRepository extends JpaRepository<LeagueTeamInvite, UUID> {
    Optional<LeagueTeamInvite> findByIdAndStatus(UUID inviteId, LeagueTeamInviteStatus status);

    Optional<LeagueTeamInvite> findByLeague_IdAndTeamIdAndStatus(
            UUID leagueId,
            UUID teamId,
            LeagueTeamInviteStatus status
    );

    List<LeagueTeamInvite> findByLeague_IdAndStatusOrderByCreatedAtDesc(
            UUID leagueId,
            LeagueTeamInviteStatus status
    );

    List<LeagueTeamInvite> findByTeamIdAndStatusOrderByCreatedAtDesc(
            UUID teamId,
            LeagueTeamInviteStatus status
    );
}
