package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMatchMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMatchMemberRepository  extends JpaRepository<TeamMatchMember, UUID> {
    Optional<TeamMatchMember> findByMatch_IdAndTeamMember_UserId(UUID matchId, String userId);

    List<TeamMatchMember> findByMatch_Id(UUID matchId);

    List<TeamMatchMember> findByMatch_IdAndTeamId(UUID matchId, UUID teamId);
}
