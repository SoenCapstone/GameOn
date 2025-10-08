package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamInvite;
import com.game.on.go_team_service.team.model.TeamInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamInviteRepository extends JpaRepository<TeamInvite, UUID> {

    List<TeamInvite> findByTeamId(UUID teamId);

    Optional<TeamInvite> findByIdAndTeamId(UUID inviteId, UUID teamId);

    Optional<TeamInvite> findByTeamIdAndInviteeUserIdAndStatus(UUID teamId, Long inviteeUserId, TeamInviteStatus status);

    Optional<TeamInvite> findByTeamIdAndInviteeEmailIgnoreCaseAndStatus(UUID teamId, String inviteeEmail, TeamInviteStatus status);

    Optional<TeamInvite> findByIdAndStatus(UUID inviteId, TeamInviteStatus status);

    List<TeamInvite> findByExpiresAtBeforeAndStatus(OffsetDateTime threshold, TeamInviteStatus status);
}
