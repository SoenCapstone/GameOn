package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueMember;
import com.game.on.go_league_service.league.model.LeagueRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueMemberRepository extends JpaRepository<LeagueMember, Long> {

    List<LeagueMember> findByLeagueId(UUID leagueId);

    List<LeagueMember> findByUserId(Long userId);

    Optional<LeagueMember> findByLeagueIdAndUserId(UUID leagueId, Long userId);

    @Query("""
        select lm.role
        from LeagueMember lm
        where lm.leagueId = :leagueId and lm.userId = :userId
    """)
    Optional<LeagueRole> findRoleByLeagueIdAndUserId(UUID leagueId, Long userId);
}