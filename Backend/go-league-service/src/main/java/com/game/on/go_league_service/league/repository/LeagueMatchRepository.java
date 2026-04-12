package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueMatchRepository extends JpaRepository<LeagueMatch, UUID> {
    List<LeagueMatch> findByLeague_IdOrderByStartTimeDesc(UUID leagueId);
    Optional<LeagueMatch> findByIdAndLeague_Id(UUID matchId, UUID leagueId);
    List<LeagueMatch> findByHomeTeamIdOrAwayTeamId(UUID homeTeamId, UUID awayTeamId);
    List<LeagueMatch> findByRefereeUserIdOrderByStartTimeDesc(String refereeUserId);

    @Query(value = """
            SELECT lm.* FROM league_matches lm
            JOIN leagues l ON lm.league_id = l.id
            JOIN venues v ON lm.venue_id = v.id
            WHERE lm.status = 'CONFIRMED'
              AND lm.start_time > CURRENT_TIMESTAMP
              AND l.privacy = 'PUBLIC'
              AND l.archived_at IS NULL
              AND v.latitude IS NOT NULL
              AND v.longitude IS NOT NULL
              AND (:sport IS NULL OR LOWER(lm.sport) = LOWER(CAST(:sport AS TEXT)))
              AND (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(:lon))
                    + sin(radians(:lat)) * sin(radians(v.latitude))
                  ))) <= :rangeKm
            ORDER BY lm.start_time ASC
            """, nativeQuery = true)
    List<LeagueMatch> findUpcomingPublicLeagueMatchesWithinRange(
            @Param("sport") String sport,
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("rangeKm") double rangeKm
    );
}
