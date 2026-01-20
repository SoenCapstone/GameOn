package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LeagueTeamRepository extends JpaRepository<LeagueTeam, UUID> {
    boolean existsByLeague_IdAndTeamId(UUID leagueId, UUID teamId);

    List<LeagueTeam> findByLeague_IdOrderByCreatedAtDesc(UUID leagueId);

    Optional<LeagueTeam> findByLeague_IdAndTeamId(UUID leagueId, UUID teamId);

    @Query("select distinct lt.league.id from LeagueTeam lt where lt.teamId in :teamIds")
    List<UUID> findLeagueIdsByTeamIdIn(@Param("teamIds") Collection<UUID> teamIds);
}
