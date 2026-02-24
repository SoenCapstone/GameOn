package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.Play;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlayRepository extends JpaRepository<Play, UUID> {

    boolean existsByIdAndTeam_Id(UUID playId, UUID teamId);

}
