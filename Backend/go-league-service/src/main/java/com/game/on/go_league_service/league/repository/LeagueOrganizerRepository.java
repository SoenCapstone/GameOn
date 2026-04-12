package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueOrganizer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueOrganizerRepository extends JpaRepository<LeagueOrganizer, UUID> {

    List<LeagueOrganizer> findByLeague_IdOrderByJoinedAtAsc(UUID leagueId);

    Optional<LeagueOrganizer> findByLeague_IdAndUserId(UUID leagueId, String userId);

    boolean existsByLeague_IdAndUserId(UUID leagueId, String userId);

    List<LeagueOrganizer> findByUserId(String userId);
}