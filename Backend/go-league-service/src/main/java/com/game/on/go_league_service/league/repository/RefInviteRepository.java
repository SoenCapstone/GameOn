package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.RefInvite;
import com.game.on.go_league_service.league.model.RefInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefInviteRepository extends JpaRepository<RefInvite, UUID> {
    Optional<RefInvite> findByMatchIdAndRefereeUserIdAndStatus(UUID matchId, String refereeUserId, RefInviteStatus status);
}
