package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMatchInvite;
import com.game.on.go_team_service.team.model.TeamMatchInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeamMatchInviteRepository extends JpaRepository<TeamMatchInvite, UUID> {
    Optional<TeamMatchInvite> findByMatch_IdAndStatus(UUID matchId, TeamMatchInviteStatus status);
}
