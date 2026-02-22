package com.game.on.go_league_service.league_post.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.service.LeagueService;
import com.game.on.go_league_service.league_post.dto.LeaguePostCreateRequest;
import com.game.on.go_league_service.league_post.dto.LeaguePostResponse;
import com.game.on.go_league_service.league_post.dto.LeaguePostUpdateRequest;
import com.game.on.go_league_service.league_post.mapper.LeaguePostMapper;
import com.game.on.go_league_service.league_post.model.LeaguePost;
import com.game.on.go_league_service.league_post.model.LeaguePostScope;
import com.game.on.go_league_service.league_post.repository.LeaguePostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaguePostServiceTest {

    @Mock private LeaguePostRepository postRepository;
    @Mock private LeagueService leagueService;
    @Mock private LeagueTeamRepository leagueTeamRepository;
    @Mock private CurrentUserProvider userProvider;
    @Mock private LeaguePostMapper mapper;

    @InjectMocks private LeaguePostService service;

    private UUID leagueId;
    private UUID postId;
    private String ownerUserId;
    private String memberUserId;
    private String outsiderUserId;

    private League league;

    @BeforeEach
    void setUp() {
        leagueId = UUID.randomUUID();
        postId = UUID.randomUUID();
        ownerUserId = "owner_user";
        memberUserId = "member_user";
        outsiderUserId = "outsider_user";

        league = League.builder()
                .id(leagueId)
                .ownerUserId(ownerUserId)
                .build();
    }

    @Test
    void owner_can_create_post() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        LeaguePostCreateRequest req = new LeaguePostCreateRequest(
                "Title",
                "Body",
                LeaguePostScope.EVERYONE
        );

        LeaguePost toSave = LeaguePost.builder()
                .leagueId(leagueId)
                .authorUserId(ownerUserId)
                .title("Title")
                .body("Body")
                .scope(LeaguePostScope.EVERYONE)
                .build();

        LeaguePost saved = LeaguePost.builder()
                .id(UUID.randomUUID())
                .leagueId(leagueId)
                .authorUserId(ownerUserId)
                .title("Title")
                .body("Body")
                .scope(LeaguePostScope.EVERYONE)
                .createdAt(OffsetDateTime.now())
                .build();

        LeaguePostResponse resp = new LeaguePostResponse(
                saved.getId(),
                leagueId,
                ownerUserId,
                "Title",
                "Body",
                LeaguePostScope.EVERYONE,
                saved.getCreatedAt()
        );

        when(mapper.toLeaguePost(leagueId, req, ownerUserId)).thenReturn(toSave);
        when(postRepository.save(toSave)).thenReturn(saved);
        when(mapper.toResponse(saved)).thenReturn(resp);

        LeaguePostResponse result = service.create(leagueId, req);

        assertEquals(resp.id(), result.id());
        assertEquals(ownerUserId, result.authorUserId());
        verify(postRepository).save(toSave);
    }

    @Test
    void non_owner_cannot_create_post() {
        when(userProvider.clerkUserId()).thenReturn("not_owner");
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        LeaguePostCreateRequest req = new LeaguePostCreateRequest(
                "Title",
                "Body",
                LeaguePostScope.EVERYONE
        );

        assertThrows(ForbiddenException.class, () -> service.create(leagueId, req));
        verify(postRepository, never()).save(any());
    }

    @Test
    void owner_list_returns_all_posts() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        LeaguePost p1 = LeaguePost.builder()
                .id(UUID.randomUUID())
                .leagueId(leagueId)
                .authorUserId(ownerUserId)
                .title("T1")
                .body("B1")
                .scope(LeaguePostScope.MEMBERS)
                .createdAt(OffsetDateTime.now())
                .build();

        Page<LeaguePost> page = new PageImpl<>(List.of(p1), PageRequest.of(0, 20), 1);

        when(postRepository.findByLeagueId(eq(leagueId), any(Pageable.class))).thenReturn(page);
        when(mapper.toResponse(p1)).thenReturn(new LeaguePostResponse(
                p1.getId(),
                leagueId,
                p1.getAuthorUserId(),
                p1.getTitle(),
                p1.getBody(),
                p1.getScope(),
                p1.getCreatedAt()
        ));

        var result = service.list(leagueId, 0, 20);

        assertEquals(1, result.items().size());
        verify(postRepository).findByLeagueId(eq(leagueId), any(Pageable.class));
        verify(postRepository, never()).findByLeagueIdAndScope(any(), any(), any());
    }

    @Test
    void outsider_list_returns_only_everyone_posts() {
        when(userProvider.clerkUserId()).thenReturn(outsiderUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        when(leagueService.fetchTeamIdsForUser()).thenReturn(List.of());

        Page<LeaguePost> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(postRepository.findByLeagueIdAndScope(eq(leagueId), eq(LeaguePostScope.EVERYONE), any(Pageable.class)))
                .thenReturn(page);

        var result = service.list(leagueId, 0, 20);

        assertEquals(0, result.items().size());
        verify(postRepository).findByLeagueIdAndScope(eq(leagueId), eq(LeaguePostScope.EVERYONE), any(Pageable.class));
        verify(postRepository, never()).findByLeagueId(any(), any());
    }

    @Test
    void member_can_read_members_scope_post() {
        when(userProvider.clerkUserId()).thenReturn(memberUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        List<UUID> myTeams = List.of(UUID.randomUUID());
        when(leagueService.fetchTeamIdsForUser()).thenReturn(myTeams);
        when(leagueTeamRepository.existsByLeague_IdAndTeamIdIn(leagueId, myTeams)).thenReturn(true);

        LeaguePost post = LeaguePost.builder()
                .id(postId)
                .leagueId(leagueId)
                .authorUserId(ownerUserId)
                .title("Members")
                .body("Only members")
                .scope(LeaguePostScope.MEMBERS)
                .createdAt(OffsetDateTime.now())
                .build();

        when(postRepository.findByIdAndLeagueId(postId, leagueId)).thenReturn(Optional.of(post));

        when(mapper.toResponse(post)).thenReturn(new LeaguePostResponse(
                postId,
                leagueId,
                ownerUserId,
                "Members",
                "Only members",
                LeaguePostScope.MEMBERS,
                post.getCreatedAt()
        ));

        LeaguePostResponse result = service.get(leagueId, postId);
        assertEquals(postId, result.id());

        verify(postRepository).findByIdAndLeagueId(postId, leagueId);
    }

    @Test
    void outsider_cannot_read_members_scope_post() {
        when(userProvider.clerkUserId()).thenReturn(outsiderUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        when(leagueService.fetchTeamIdsForUser()).thenReturn(List.of());

        LeaguePost post = LeaguePost.builder()
                .id(postId)
                .leagueId(leagueId)
                .authorUserId(ownerUserId)
                .title("Members")
                .body("Only members")
                .scope(LeaguePostScope.MEMBERS)
                .createdAt(OffsetDateTime.now())
                .build();

        when(postRepository.findByIdAndLeagueId(postId, leagueId)).thenReturn(Optional.of(post));

        assertThrows(ForbiddenException.class, () -> service.get(leagueId, postId));
        verify(postRepository).findByIdAndLeagueId(postId, leagueId);
    }

    @Test
    void non_owner_cannot_update_or_delete() {
        when(userProvider.clerkUserId()).thenReturn(memberUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        LeaguePostUpdateRequest update = new LeaguePostUpdateRequest(
                "New title",
                "New body",
                LeaguePostScope.EVERYONE
        );

        assertThrows(ForbiddenException.class, () -> service.update(leagueId, postId, update));
        assertThrows(ForbiddenException.class, () -> service.delete(leagueId, postId));

        verify(postRepository, never()).save(any());
        verify(postRepository, never()).delete(any());
    }

    @Test
    void not_found_when_post_does_not_exist() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league);

        when(postRepository.findByIdAndLeagueId(postId, leagueId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> service.get(leagueId, postId));
    }
}
