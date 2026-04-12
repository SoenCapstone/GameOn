package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.TeamMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TeamMatchRepository extends JpaRepository<TeamMatch, UUID> {
    List<TeamMatch> findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(UUID homeTeamId, UUID awayTeamId);
    List<TeamMatch> findByRefereeUserIdOrderByStartTimeDesc(String refereeUserId);

    @Query(value = """
            SELECT tm.* FROM team_matches tm
            JOIN teams t ON tm.home_team_id = t.id
            JOIN venues v ON tm.venue_id = v.id
            WHERE tm.status = 'CONFIRMED'
              AND tm.start_time > CURRENT_TIMESTAMP
              AND t.privacy = 'PUBLIC'
              AND t.deleted_at IS NULL
              AND v.latitude IS NOT NULL
              AND v.longitude IS NOT NULL
              AND (:sport IS NULL OR LOWER(tm.sport) = LOWER(CAST(:sport AS TEXT)))
              AND (6371 * acos(LEAST(1.0,
                    cos(radians(:lat)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(:lon))
                    + sin(radians(:lat)) * sin(radians(v.latitude))
                  ))) <= :rangeKm
            ORDER BY tm.start_time ASC
            """, nativeQuery = true)
    List<TeamMatch> findUpcomingPublicTeamMatchesWithinRange(
            @Param("sport") String sport,
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("rangeKm") double rangeKm
    );
}
