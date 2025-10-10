package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findByTeamId(UUID teamId);

    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, Long userId);

    boolean existsByTeamIdAndUserId(UUID teamId, Long userId);

    long countByTeamIdAndStatus(UUID teamId, TeamMemberStatus status);

    boolean existsByTeamIdAndRole(UUID teamId, TeamRole role);

    @Query("select tm from TeamMember tm where tm.userId = :userId and tm.team.deletedAt is null")
    List<TeamMember> findActiveMemberships(Long userId);
}
