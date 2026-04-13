package com.game.on.go_league_service.league.follow.repository;

import com.game.on.go_league_service.league.follow.model.LeagueFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueFollowRepository extends JpaRepository<LeagueFollow, UUID> {

    boolean existsByLeagueIdAndUserId(UUID leagueId, String userId);

    Optional<LeagueFollow> findByLeagueIdAndUserId(UUID leagueId, String userId);

    List<LeagueFollow> findByUserIdOrderByCreatedAtDesc(String userId);

    void deleteByLeagueIdAndUserId(UUID leagueId, String userId);
}
