package com.game.on.go_team_service.team_announcement.repository;

import com.game.on.go_team_service.team_announcement.model.TeamAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeamAnnouncementRepository extends JpaRepository<TeamAnnouncement, UUID> {

    Page<TeamAnnouncement> findByTeamId(UUID teamId, Pageable pageable);

    Optional<TeamAnnouncement> findByIdAndTeamId(UUID id, UUID teamId);
}
