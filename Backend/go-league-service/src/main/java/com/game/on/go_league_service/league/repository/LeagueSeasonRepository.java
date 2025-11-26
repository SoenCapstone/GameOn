package com.game.on.go_league_service.league.repository;

import com.game.on.go_league_service.league.model.LeagueSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface LeagueSeasonRepository extends JpaRepository<LeagueSeason, UUID> {

    List<LeagueSeason> findByLeague_IdAndArchivedAtIsNullOrderByStartDateAscNameAsc(UUID leagueId);

    long countByLeague_IdAndArchivedAtIsNull(UUID leagueId);

    @Query("SELECT ls.league.id AS leagueId, COUNT(ls) AS count " +
            "FROM LeagueSeason ls " +
            "WHERE ls.league.id IN :leagueIds AND ls.archivedAt IS NULL " +
            "GROUP BY ls.league.id")
    List<LeagueSeasonCountProjection> countActiveSeasonsByLeagueIds(Collection<UUID> leagueIds);

    interface LeagueSeasonCountProjection {
        UUID getLeagueId();

        long getCount();
    }
}
