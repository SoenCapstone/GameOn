package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueMatch;
import com.game.on.go_league_service.league.model.LeagueMatchMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueMatchMemberRepository extends JpaRepository<LeagueMatchMember, UUID> {
    Optional<LeagueMatchMember> findByMatch_IdAndUserId(UUID matchId, String userId);
    List<LeagueMatchMember> findByMatchId(UUID matchId);
}
