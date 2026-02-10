package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMatchScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeamMatchScoreRepository extends JpaRepository<TeamMatchScore, UUID> {
    Optional<TeamMatchScore> findByMatch_Id(UUID matchId);
}
