package com.game.on.go_team_service.team.repository;

import com.game.on.go_team_service.team.model.PlayEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PlayEdgeRepository extends JpaRepository<PlayEdge, UUID> {

    @Query("""
        select e
        from PlayEdge e
        join fetch e.from
        join fetch e.to
        where e.play.id = :playId
    """)
    List<PlayEdge> findByPlayIdWithNodes(@Param("playId") UUID playId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from PlayEdge e where e.play.id = :playId")
    void deleteByPlayId(@Param("playId") UUID playId);
}

