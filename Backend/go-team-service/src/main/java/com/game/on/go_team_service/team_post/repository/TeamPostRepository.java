package com.game.on.go_team_service.team_post.repository;

import com.game.on.go_team_service.team_post.model.TeamPost;
import com.game.on.go_team_service.team_post.model.TeamPostScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TeamPostRepository extends JpaRepository<TeamPost, UUID> {

    Page<TeamPost> findByTeamId(UUID teamId, Pageable pageable);

    Page<TeamPost> findByTeamIdAndScope(UUID teamId, TeamPostScope scope, Pageable pageable);

    Optional<TeamPost> findByIdAndTeamId(UUID id, UUID teamId);
}
