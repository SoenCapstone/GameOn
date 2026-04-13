package com.game.on.go_team_service.team.follow.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.follow.model.TeamFollow;
import com.game.on.go_team_service.team.follow.repository.TeamFollowRepository;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamPrivacy;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamFollowServiceTest {

    @Mock
    TeamRepository teamRepository;

    @Mock
    TeamMemberRepository teamMemberRepository;

    @Mock
    TeamFollowRepository teamFollowRepository;

    @Mock
    CurrentUserProvider currentUserProvider;

    @InjectMocks
    TeamFollowService service;

    private final String userId = "user_clerk_1";
    private final UUID teamId = UUID.randomUUID();

    @Test
    void follow_succeeds_whenPublicNotMember_andSaves() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team(TeamPrivacy.PUBLIC)));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.empty());
        when(teamFollowRepository.existsByTeamIdAndUserId(teamId, userId)).thenReturn(false);

        service.follow(teamId);

        ArgumentCaptor<TeamFollow> captor = ArgumentCaptor.forClass(TeamFollow.class);
        verify(teamFollowRepository).save(captor.capture());
        assertThat(captor.getValue().getTeamId()).isEqualTo(teamId);
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void follow_isIdempotent_whenAlreadyFollowing() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team(TeamPrivacy.PUBLIC)));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.empty());
        when(teamFollowRepository.existsByTeamIdAndUserId(teamId, userId)).thenReturn(true);

        service.follow(teamId);

        verify(teamFollowRepository, never()).save(any());
    }

    @Test
    void follow_throwsForbidden_whenPrivateTeam() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team(TeamPrivacy.PRIVATE)));

        assertThatThrownBy(() -> service.follow(teamId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("public");
    }

    @Test
    void follow_throwsForbidden_whenActiveMember() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team(TeamPrivacy.PUBLIC)));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.of(
                TeamMember.builder()
                        .userId(userId)
                        .role(TeamRole.PLAYER)
                        .status(TeamMemberStatus.ACTIVE)
                        .build()
        ));

        assertThatThrownBy(() -> service.follow(teamId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("members");
    }

    @Test
    void follow_throwsNotFound_whenTeamMissing() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.follow(teamId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void unfollow_isIdempotent_whenNotFollowing() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team(TeamPrivacy.PUBLIC)));

        service.unfollow(teamId);

        verify(teamFollowRepository).deleteByTeamIdAndUserId(teamId, userId);
    }

    private Team team(TeamPrivacy privacy) {
        Team t = new Team();
        t.setId(teamId);
        t.setPrivacy(privacy);
        return t;
    }
}
