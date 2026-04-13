package com.game.on.go_team_service.team.follow.repository;

import com.game.on.go_team_service.team.follow.model.TeamFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamFollowRepository extends JpaRepository<TeamFollow, UUID> {

    boolean existsByTeamIdAndUserId(UUID teamId, String userId);

    Optional<TeamFollow> findByTeamIdAndUserId(UUID teamId, String userId);

    List<TeamFollow> findByUserIdOrderByCreatedAtDesc(String userId);

    void deleteByTeamIdAndUserId(UUID teamId, String userId);
}
