package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID>, JpaSpecificationExecutor<Team> {

    Optional<Team> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Team> findBySlugIgnoreCaseAndDeletedAtIsNull(String slug);

    boolean existsBySlug(String slug);

    boolean existsByIdAndOwnerUserId(UUID id, Long ownerUserId);
}
