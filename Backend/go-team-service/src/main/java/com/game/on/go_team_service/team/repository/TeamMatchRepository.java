package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeamMatchRepository extends JpaRepository<TeamMatch, UUID> {
    List<TeamMatch> findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(UUID homeTeamId, UUID awayTeamId);
}
