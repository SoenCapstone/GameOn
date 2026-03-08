package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.RefereeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefereeProfileRepository extends JpaRepository<RefereeProfile, String> {
    List<RefereeProfile> findByIsActive(boolean isActive);

    Optional<RefereeProfile> findByUserId(String userId);

    boolean existsByUserId(String userId);

    
}
