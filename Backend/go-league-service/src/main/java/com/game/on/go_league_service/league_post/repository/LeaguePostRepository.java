package com.game.on.go_league_service.league_post.repository;

import com.game.on.go_league_service.league_post.model.LeaguePost;
import com.game.on.go_league_service.league_post.model.LeaguePostScope;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LeaguePostRepository extends JpaRepository<LeaguePost, UUID> {

    Page<LeaguePost> findByLeagueId(UUID leagueId, Pageable pageable);

    Page<LeaguePost> findByLeagueIdAndScope(UUID leagueId, LeaguePostScope scope, Pageable pageable);

    Optional<LeaguePost> findByIdAndLeagueId(UUID postId, UUID leagueId);

}
