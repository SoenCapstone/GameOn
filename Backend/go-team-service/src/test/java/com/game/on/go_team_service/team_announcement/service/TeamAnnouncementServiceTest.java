package com.game.on.go_team_service.team_announcement.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementCreateRequest;
import com.game.on.go_team_service.team_announcement.mapper.TeamAnnouncementMapper;
import com.game.on.go_team_service.team_announcement.model.TeamAnnouncement;
import com.game.on.go_team_service.team_announcement.repository.TeamAnnouncementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamAnnouncementServiceTest {

    @Mock TeamAnnouncementRepository announcementRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock CurrentUserProvider currentUserProvider;
    @Mock TeamAnnouncementMapper teamAnnouncementMapper;

    @InjectMocks TeamAnnouncementService service;

    @Test
    void create_allowsOwnerCoachManager() {
        UUID teamId = UUID.randomUUID();
        String userId = "user_123";

        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(TeamMember.builder()
                        .userId(userId)
                        .role(TeamRole.COACH)
                        .status(TeamMemberStatus.ACTIVE)
                        .build()));

        TeamAnnouncementCreateRequest request =
                new TeamAnnouncementCreateRequest("Title", teamId, "Hello team");

        TeamAnnouncement mapped = TeamAnnouncement.builder()
                .teamId(teamId)
                .authorUserId(userId)
                .title("Title")
                .content("Hello team")
                .build();

        when(teamAnnouncementMapper.toTeamAnnouncement(eq(teamId), any(TeamAnnouncementCreateRequest.class), eq(userId)))
                .thenReturn(mapped);

        when(announcementRepository.save(any(TeamAnnouncement.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        service.create(teamId, request);

        verify(announcementRepository).save(mapped);
        verify(teamAnnouncementMapper).toTeamAnnouncement(eq(teamId), eq(request), eq(userId));
    }

    @Test
    void create_blocksRegularMembers() {
        UUID teamId = UUID.randomUUID();
        String userId = "user_123";

        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(TeamMember.builder()
                        .userId(userId)
                        .role(TeamRole.PLAYER)
                        .status(TeamMemberStatus.ACTIVE)
                        .build()));

        TeamAnnouncementCreateRequest request =
                new TeamAnnouncementCreateRequest("t", teamId, "c");

        assertThatThrownBy(() -> service.create(teamId, request))
                .isInstanceOf(ForbiddenException.class);

        verifyNoInteractions(teamAnnouncementMapper);
        verifyNoInteractions(announcementRepository);
    }
}
