package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueMatchScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LeagueMatchScoreRepository extends JpaRepository<LeagueMatchScore, UUID> {
    Optional<LeagueMatchScore> findByMatch_Id(UUID matchId);
}
