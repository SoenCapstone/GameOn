package com.game.on.go_team_service.team_post.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team_post.dto.TeamPostCreateRequest;
import com.game.on.go_team_service.team_post.dto.TeamPostResponse;
import com.game.on.go_team_service.team_post.mapper.TeamPostMapper;
import com.game.on.go_team_service.team_post.model.TeamPost;
import com.game.on.go_team_service.team_post.model.TeamPostScope;
import com.game.on.go_team_service.team_post.repository.TeamPostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamPostServiceTest {

    @Mock
    TeamPostRepository postRepository;

    @Mock
    TeamMemberRepository teamMemberRepository;

    @Mock
    CurrentUserProvider currentUserProvider;

    @Mock
    TeamPostMapper teamPostMapper;

    @InjectMocks
    TeamPostService service;

    @Test
    void create_allowsOwnerCoachManager_andSavesPost() {
        UUID teamId = UUID.randomUUID();
        String userId = "user_123";

        when(currentUserProvider.clerkUserId()).thenReturn(userId);

        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(
                        TeamMember.builder()
                                .userId(userId)
                                .role(TeamRole.COACH)
                                .status(TeamMemberStatus.ACTIVE)
                                .build()
                ));

        TeamPostCreateRequest request = new TeamPostCreateRequest(
                "Practice Update",
                teamId,
                "Practice moved to 6pm today.",
                TeamPostScope.MEMBERS
        );

        String authorRole = "COACH";

        TeamPost mapped = TeamPost.builder()
                .teamId(teamId)
                .authorUserId(userId)
                .authorRole(authorRole)
                .title(request.title())
                .body(request.body())
                .scope(request.scope())
                .build();

        TeamPost saved = TeamPost.builder()
                .id(UUID.randomUUID())
                .teamId(teamId)
                .authorUserId(userId)
                .authorRole(authorRole)
                .title(request.title())
                .body(request.body())
                .scope(request.scope())
                .createdAt(OffsetDateTime.now())
                .build();

        TeamPostResponse response = new TeamPostResponse(
                saved.getId(),
                saved.getTeamId(),
                saved.getAuthorUserId(),
                saved.getAuthorRole(),
                saved.getTitle(),
                saved.getBody(),
                saved.getScope(),
                saved.getCreatedAt()
        );

        when(teamPostMapper.toTeamPost(eq(teamId), eq(request), eq(userId), eq(authorRole)))
                .thenReturn(mapped);

        when(postRepository.save(any(TeamPost.class)))
                .thenReturn(saved);

        when(teamPostMapper.toResponse(saved))
                .thenReturn(response);

        service.create(teamId, request);

        verify(teamPostMapper).toTeamPost(teamId, request, userId, authorRole);
        verify(postRepository).save(mapped);
        verify(teamPostMapper).toResponse(saved);
    }

    @Test
    void create_blocksRegularMembers() {
        UUID teamId = UUID.randomUUID();
        String userId = "user_123";

        when(currentUserProvider.clerkUserId()).thenReturn(userId);

        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(
                        TeamMember.builder()
                                .userId(userId)
                                .role(TeamRole.PLAYER)
                                .status(TeamMemberStatus.ACTIVE)
                                .build()
                ));

        TeamPostCreateRequest request = new TeamPostCreateRequest(
                "t",
                teamId,
                "b",
                TeamPostScope.EVERYONE
        );

        assertThatThrownBy(() -> service.create(teamId, request))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(teamPostMapper);
        verifyNoInteractions(postRepository);
    }

    @Test
    void create_blocksNonMembers() {
        UUID teamId = UUID.randomUUID();
        String userId = "user_123";

        when(currentUserProvider.clerkUserId()).thenReturn(userId);

        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.empty());

        TeamPostCreateRequest request = new TeamPostCreateRequest(
                "t",
                teamId,
                "b",
                TeamPostScope.MEMBERS
        );

        assertThatThrownBy(() -> service.create(teamId, request))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(teamPostMapper);
        verifyNoInteractions(postRepository);
    }
}
