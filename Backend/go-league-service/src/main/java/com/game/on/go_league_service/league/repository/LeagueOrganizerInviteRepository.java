package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueOrganizerInvite;
import com.game.on.go_league_service.league.model.LeagueOrganizerInviteStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueOrganizerInviteRepository extends JpaRepository<LeagueOrganizerInvite, UUID> {

    Optional<LeagueOrganizerInvite> findByLeague_IdAndInviteeUserIdAndStatus(
            UUID leagueId, String inviteeUserId, LeagueOrganizerInviteStatus status);

    List<LeagueOrganizerInvite> findByLeague_IdAndStatusOrderByCreatedAtDesc(
            UUID leagueId, LeagueOrganizerInviteStatus status);

    Optional<LeagueOrganizerInvite> findByIdAndStatus(
            UUID id, LeagueOrganizerInviteStatus status);
}