package com.game.on.go_team_service;


import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.service.TeamSpecifications;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpecificationsTest {

    @Test
    void notArchived_buildsIsNullDeletedAtPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Path<Object> deletedAtPath = mock(Path.class);
        Predicate expected = mock(Predicate.class);

        when(root.get("deletedAt")).thenReturn(deletedAtPath);
        when(builder.isNull(deletedAtPath)).thenReturn(expected);

        Predicate out = TeamSpecifications.notArchived().toPredicate(root, query, builder);

        assertSame(expected, out);
        verify(root).get("deletedAt");
        verify(builder).isNull(deletedAtPath);
        verifyNoMoreInteractions(builder);
    }

    @Test
    void withLeague_whenNull_returnsNullPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Predicate out = TeamSpecifications.withLeague(null).toPredicate(root, query, builder);

        assertNull(out);
        verifyNoInteractions(root, query, builder);
    }

    @Test
    void withLeague_whenProvided_buildsEqualPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        UUID leagueId = UUID.randomUUID();
        Path<Object> leaguePath = mock(Path.class);
        Predicate expected = mock(Predicate.class);

        when(root.get("leagueId")).thenReturn(leaguePath);
        when(builder.equal(leaguePath, leagueId)).thenReturn(expected);

        Predicate out = TeamSpecifications.withLeague(leagueId).toPredicate(root, query, builder);

        assertSame(expected, out);
        verify(root).get("leagueId");
        verify(builder).equal(leaguePath, leagueId);
        verifyNoMoreInteractions(builder);
    }

    @Test
    void withSport_whenNull_returnsNullPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Predicate out = TeamSpecifications.withSport(null).toPredicate(root, query, builder);

        assertNull(out);
        verifyNoInteractions(root, query, builder);
    }

    @Test
    void search_whenNull_returnsNullPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Predicate out = TeamSpecifications.search(null).toPredicate(root, query, builder);

        assertNull(out);
        verifyNoInteractions(root, query, builder);
    }

    @Test
    void mine_whenUserIdNull_returnsNullPredicate_andDoesNotJoinOrDistinct() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        Predicate out = TeamSpecifications.mine(null).toPredicate(root, query, builder);

        assertNull(out);
        verifyNoInteractions(root, query, builder);
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void mine_whenUserIdProvided_setsDistinct_joinsMembers_andBuildsAndPredicate() {
        Root<Team> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder builder = mock(CriteriaBuilder.class);

        String userId = "user_123";

        Join join = mock(Join.class);
        Path userIdPath = mock(Path.class);
        Path statusPath = mock(Path.class);

        Predicate userEq = mock(Predicate.class);
        Predicate statusEq = mock(Predicate.class);
        Predicate expectedAnd = mock(Predicate.class);

        when(root.join("members", JoinType.INNER)).thenReturn(join);
        when(join.get("userId")).thenReturn(userIdPath);
        when(join.get("status")).thenReturn(statusPath);

        when(builder.equal(userIdPath, userId)).thenReturn(userEq);
        when(builder.equal(statusPath, TeamMemberStatus.ACTIVE)).thenReturn(statusEq);
        when(builder.and(userEq, statusEq)).thenReturn(expectedAnd);

        Predicate out = TeamSpecifications.mine(userId).toPredicate(root, query, builder);

        assertSame(expectedAnd, out);

        verify(query).distinct(true);
        verify(root).join("members", JoinType.INNER);
        verify(join).get("userId");
        verify(join).get("status");
        verify(builder).equal(userIdPath, userId);
        verify(builder).equal(statusPath, TeamMemberStatus.ACTIVE);
        verify(builder).and(userEq, statusEq);
        verifyNoMoreInteractions(builder);
    }
}

