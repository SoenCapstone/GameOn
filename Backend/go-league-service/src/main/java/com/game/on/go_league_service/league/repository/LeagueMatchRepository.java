package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueMatchRepository extends JpaRepository<LeagueMatch, UUID> {
    List<LeagueMatch> findByLeague_IdOrderByStartTimeDesc(UUID leagueId);
    Optional<LeagueMatch> findByIdAndLeague_Id(UUID matchId, UUID leagueId);
    List<LeagueMatch> findByHomeTeamIdOrAwayTeamId(UUID homeTeamId, UUID awayTeamId);
}
