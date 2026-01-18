package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeagueTeamRepository extends JpaRepository<LeagueTeam, UUID> {
    boolean existsByLeague_IdAndTeamId(UUID leagueId, UUID teamId);

    List<LeagueTeam> findByLeague_IdOrderByCreatedAtDesc(UUID leagueId);
}
