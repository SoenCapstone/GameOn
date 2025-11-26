package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.League;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface LeagueRepository extends JpaRepository<League, UUID>, JpaSpecificationExecutor<League> {

    Optional<League> findByIdAndArchivedAtIsNull(UUID id);

    Optional<League> findBySlugIgnoreCaseAndArchivedAtIsNull(String slug);

    boolean existsBySlug(String slug);
}
