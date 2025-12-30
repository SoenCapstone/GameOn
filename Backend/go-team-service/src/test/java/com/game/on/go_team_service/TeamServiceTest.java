package com.game.on.go_team_service;

import com.game.on.go_team_service.client.UserClient;
import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.mapper.TeamMapper;
import com.game.on.go_team_service.team.metrics.TeamMetricsPublisher;
import com.game.on.go_team_service.team.model.*;
import com.game.on.go_team_service.team.repository.TeamInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.go_team_service.team.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamInviteRepository teamInviteRepository;
    @Mock UserClient userClient;
    @Mock CurrentUserProvider userProvider;
    @Mock TeamMapper teamMapper;
    @Mock TeamMetricsPublisher metricsPublisher;

    @InjectMocks
    TeamService teamService;

    private final String callerUserId = "user_123";
    private final UUID teamId = UUID.randomUUID();

    @BeforeEach
    void setup() {
        when(userProvider.clerkUserId()).thenReturn(callerUserId);
    }

    @Test
    void createTeam_savesTeam_addsOwnerMember_publishesMetric() {
        TeamCreateRequest request = mock(TeamCreateRequest.class);

        Team mappedTeam = new Team();
        mappedTeam.setId(teamId);

        Team savedTeam = new Team();
        savedTeam.setId(teamId);

        TeamMember ownerMember = new TeamMember();

        TeamDetailResponse detailResponse = mock(TeamDetailResponse.class);

        when(teamMapper.toTeam(request, callerUserId)).thenReturn(mappedTeam);
        when(teamRepository.save(mappedTeam)).thenReturn(savedTeam);
        when(teamMapper.toTeamMember(any(Team.class), eq(callerUserId), eq(TeamRole.OWNER))).thenReturn(ownerMember);
        when(teamMapper.toDetail(savedTeam)).thenReturn(detailResponse);

        TeamDetailResponse out = teamService.createTeam(request);

        assertSame(detailResponse, out);
        verify(teamRepository).save(mappedTeam);
        verify(teamMemberRepository).save(ownerMember);
        verify(metricsPublisher).teamCreated();
    }

    @Test
    void archiveTeam_whenCallerNotOwner_throwsForbidden() {
        Team team = new Team();
        team.setId(teamId);

        TeamMember callerMembership = new TeamMember();
        callerMembership.setRole(TeamRole.MANAGER);
        callerMembership.setStatus(TeamMemberStatus.ACTIVE);

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, callerUserId))
                .thenReturn(Optional.of(callerMembership));

        assertThrows(ForbiddenException.class, () -> teamService.archiveTeam(teamId));

        verify(teamRepository, never()).save(any());
        verify(metricsPublisher, never()).teamArchived();
    }

    @Test
    void archiveTeam_whenOwner_archivesAndPublishesMetric() {
        Team team = new Team();
        team.setId(teamId);

        TeamMember callerMembership = new TeamMember();
        callerMembership.setRole(TeamRole.OWNER);
        callerMembership.setStatus(TeamMemberStatus.ACTIVE);

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, callerUserId))
                .thenReturn(Optional.of(callerMembership));

        teamService.archiveTeam(teamId);

        assertNotNull(team.getDeletedAt());
        verify(teamRepository).save(team);
        verify(metricsPublisher).teamArchived();
    }

    @Test
    void removeMember_cannotRemoveOwner_throwsForbidden() {
        Team team = new Team();
        team.setId(teamId);

        TeamMember caller = new TeamMember();
        caller.setRole(TeamRole.OWNER);
        caller.setStatus(TeamMemberStatus.ACTIVE);

        TeamMember target = new TeamMember();
        target.setRole(TeamRole.OWNER);

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, callerUserId)).thenReturn(Optional.of(caller));
        when(teamMemberRepository.findByTeamIdAndUserId(teamId, "targetUser")).thenReturn(Optional.of(target));

        assertThrows(ForbiddenException.class, () -> teamService.removeMember(teamId, "targetUser"));
        verify(teamMemberRepository, never()).delete(any());
    }

    @Test
    void listTeams_buildsPageable_andReturnsResponse() {
        TeamSearchCriteria criteria = new TeamSearchCriteria(false, null, null, null);

        Team t1 = new Team();
        Team t2 = new Team();

        TeamSummaryResponse s1 = mock(TeamSummaryResponse.class);
        TeamSummaryResponse s2 = mock(TeamSummaryResponse.class);

        Page<Team> page = new PageImpl<>(
                List.of(t1, t2),
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")),
                2
        );

        when(teamRepository.findAll(Mockito.<Specification<Team>>any(), any(Pageable.class)))
                .thenReturn(page);

        // return different summaries based on identity
        when(teamMapper.toSummary(any(Team.class))).thenAnswer(inv -> {
            Team arg = inv.getArgument(0);
            return (arg == t1) ? s1 : (arg == t2) ? s2 : null;
        });

        TeamListResponse out = teamService.listTeams(criteria, 0, 20);

        assertEquals(2L, out.totalElements());
        assertEquals(0, out.page());
        assertEquals(20, out.size());
        assertFalse(out.hasNext());
        assertEquals(List.of(s1, s2), out.items());

        // ✅ verify repo called with pageable
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(teamRepository).findAll(Mockito.<Specification<Team>>any(), pageableCaptor.capture());
        Pageable used = pageableCaptor.getValue();
        assertEquals(0, used.getPageNumber());
        assertEquals(20, used.getPageSize());
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), used.getSort());

        // ✅ verify mapper called exactly twice, and inspect arguments
        ArgumentCaptor<Team> teamCaptor = ArgumentCaptor.forClass(Team.class);
        verify(teamMapper, times(2)).toSummary(teamCaptor.capture());

        List<Team> mappedTeams = teamCaptor.getAllValues();
        // This will tell you if it was (t1,t2) or (t1,t1) etc.
        org.junit.jupiter.api.Assertions.assertSame(t1, mappedTeams.get(0));
        org.junit.jupiter.api.Assertions.assertSame(t2, mappedTeams.get(1));
    }



    @Test
    void createInvite_whenInviteeAlreadyMember_throwsConflict() {
        UUID teamId = UUID.randomUUID();
        TeamInviteCreateRequest request = new TeamInviteCreateRequest(
                teamId,
                "invitee_999",
                TeamRole.PLAYER,
                OffsetDateTime.now().plusDays(3)
        );

        Team team = new Team();
        team.setId(teamId);

        TeamMember caller = new TeamMember();
        caller.setRole(TeamRole.OWNER);
        caller.setStatus(TeamMemberStatus.ACTIVE);

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId))
                .thenReturn(Optional.of(team));

        when(teamMemberRepository.findByTeamIdAndUserId(teamId, callerUserId))
                .thenReturn(Optional.of(caller));

        // This is the condition under test
        when(teamMemberRepository.existsByTeamIdAndUserId(teamId, "invitee_999"))
                .thenReturn(true);

        assertThrows(ConflictException.class, () -> teamService.createInvite(request));

        verify(teamInviteRepository, never()).save(any());
        verify(metricsPublisher, never()).inviteSent();
    }


    @Test
    void acceptInvite_whenExpired_setsExpiredAndThrowsBadRequest() {
        UUID inviteId = UUID.randomUUID();
        TeamInvitationReply reply = new TeamInvitationReply(inviteId, true);

        Team team = new Team();
        team.setId(teamId);

        TeamInvite invite = new TeamInvite();
        invite.setId(inviteId);
        invite.setTeam(team);
        invite.setStatus(TeamInviteStatus.PENDING);
        invite.setInviteeUserId(callerUserId);
        invite.setExpiresAt(OffsetDateTime.now().minusMinutes(1)); // expired

        when(teamInviteRepository.findByIdAndStatus(inviteId, TeamInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));

        // requireActiveTeam will be called after freshness check, but freshness throws first
        assertThrows(BadRequestException.class, () -> teamService.acceptInvite(reply));

        assertEquals(TeamInviteStatus.EXPIRED, invite.getStatus());
        verify(teamInviteRepository).save(invite);
        verify(metricsPublisher, never()).inviteAccepted();
    }

    @Test
    void acceptInvite_happyPath_savesMember_updatesInvite_publishesMetric() {
        UUID inviteId = UUID.randomUUID();
        TeamInvitationReply reply = new TeamInvitationReply(inviteId, true);

        Team team = new Team();
        team.setId(teamId);

        TeamInvite invite = new TeamInvite();
        invite.setId(inviteId);
        invite.setTeam(team);
        invite.setStatus(TeamInviteStatus.PENDING);
        invite.setInviteeUserId(callerUserId);
        invite.setRole(TeamRole.PLAYER);
        invite.setExpiresAt(OffsetDateTime.now().plusDays(1));

        when(teamInviteRepository.findByIdAndStatus(inviteId, TeamInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId)).thenReturn(Optional.of(team));
        when(teamMemberRepository.existsByTeamIdAndUserId(teamId, callerUserId)).thenReturn(false);

        TeamMember newMember = new TeamMember();
        newMember.setTeam(team);
        newMember.setUserId(callerUserId);
        newMember.setRole(TeamRole.PLAYER);
        newMember.setStatus(TeamMemberStatus.ACTIVE);

        TeamMemberResponse memberResponse = mock(TeamMemberResponse.class);

        when(teamMapper.toTeamMember(team, callerUserId, TeamRole.PLAYER)).thenReturn(newMember);
        when(teamMapper.toMember(newMember)).thenReturn(memberResponse);

        TeamMemberResponse out = teamService.acceptInvite(reply);

        assertSame(memberResponse, out);

        verify(teamMemberRepository).save(newMember);
        verify(teamInviteRepository).save(invite);
        verify(metricsPublisher).inviteAccepted();

        assertEquals(TeamInviteStatus.ACCEPTED, invite.getStatus());
        assertNotNull(invite.getRespondedAt());
        assertEquals(callerUserId, invite.getInviteeUserId());
    }
}
