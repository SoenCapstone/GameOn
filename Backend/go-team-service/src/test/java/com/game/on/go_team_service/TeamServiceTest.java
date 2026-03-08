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
import com.game.on.go_team_service.team.repository.*;
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

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamInviteRepository teamInviteRepository;
    @Mock PlayRepository playRepository;
    @Mock PlayNodeRepository playNodeRepository;
    @Mock PlayEdgeRepository playEdgeRepository;
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
        lenient().when(userProvider.clerkUserId()).thenReturn(callerUserId);
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

    @Test
    void createPlay_happyPath_savesPlayNodesAndEdges_andReturnsPlayId() {
        UUID n1 = UUID.randomUUID();
        UUID n2 = UUID.randomUUID();
        UUID edgeId = UUID.randomUUID();

        PersonNodeDTO node1 = new PersonNodeDTO(n1, 10.0, 20.0, 32.0, "user_aaa");
        PersonNodeDTO node2 = new PersonNodeDTO(n2, 30.0, 40.0, 28.0, null);

        ArrowDTO arrow = new ArrowDTO(
                edgeId,
                new NodeRefDTO(n1),
                new NodeRefDTO(n2)
        );

        List<PlayItemDTO> items = List.of(node1, node2, arrow);

        ArgumentCaptor<Play> playCaptor = ArgumentCaptor.forClass(Play.class);
        ArgumentCaptor<List<PlayNode>> nodeListCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<List<PlayEdge>> edgeListCaptor = ArgumentCaptor.forClass(List.class);

        when(playNodeRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(playEdgeRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        UUID playId = teamService.createPlay(items);

        verify(playRepository).save(playCaptor.capture());
        Play savedPlay = playCaptor.getValue();

        assertNotNull(playId);
        assertEquals(savedPlay.getId(), playId);

        verify(playNodeRepository).saveAll(nodeListCaptor.capture());
        List<PlayNode> savedNodes = nodeListCaptor.getValue();
        assertEquals(2, savedNodes.size());

        Map<UUID, PlayNode> nodeById = new HashMap<>();
        for (PlayNode pn : savedNodes) nodeById.put(pn.getId(), pn);

        PlayNode savedN1 = nodeById.get(n1);
        PlayNode savedN2 = nodeById.get(n2);

        assertNotNull(savedN1);
        assertNotNull(savedN2);

        assertEquals(savedPlay, savedN1.getPlay());
        assertEquals(savedPlay, savedN2.getPlay());

        assertEquals(PlayMakerShapeType.PERSON, savedN1.getType());
        assertEquals(PlayMakerShapeType.PERSON, savedN2.getType());

        assertEquals(10.0, savedN1.getX());
        assertEquals(20.0, savedN1.getY());
        assertEquals(32.0, savedN1.getSize());
        assertEquals("user_aaa", savedN1.getAssociatedPlayerId());

        assertEquals(30.0, savedN2.getX());
        assertEquals(40.0, savedN2.getY());
        assertEquals(28.0, savedN2.getSize());
        assertNull(savedN2.getAssociatedPlayerId());

        verify(playEdgeRepository).saveAll(edgeListCaptor.capture());
        List<PlayEdge> savedEdges = edgeListCaptor.getValue();
        assertEquals(1, savedEdges.size());

        PlayEdge e = savedEdges.get(0);
        assertEquals(edgeId, e.getId());
        assertEquals(savedPlay, e.getPlay());
        assertSame(savedN1, e.getFrom());
        assertSame(savedN2, e.getTo());
    }

    @Test
    void getPlayItems_whenMemberAndPlayBelongsToTeam_returnsMappedItems() {
        UUID teamId = UUID.randomUUID();
        UUID playId = UUID.randomUUID();
        String userId = "clerk_user_123";

        when(userProvider.clerkUserId()).thenReturn(userId);

        Team team = new Team();
        team.setId(teamId);
        team.setDeletedAt(null);

        when(teamRepository.findByIdAndDeletedAtIsNull(teamId))
                .thenReturn(Optional.of(team));

        TeamMember membership = new TeamMember();
        membership.setTeam(team);
        membership.setUserId(userId);
        membership.setStatus(TeamMemberStatus.ACTIVE);

        when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId))
                .thenReturn(Optional.of(membership));

        when(playRepository.existsByIdAndTeam_Id(playId, teamId)).thenReturn(true);

        UUID node1Id = UUID.randomUUID();
        UUID node2Id = UUID.randomUUID();
        UUID edgeId = UUID.randomUUID();

        Play play = Play.builder().id(playId).build();

        PlayNode node1 = PlayNode.builder()
                .id(node1Id)
                .play(play)
                .type(PlayMakerShapeType.PERSON)
                .x(10.0).y(20.0).size(30.0)
                .associatedPlayerId("p1")
                .build();

        PlayNode node2 = PlayNode.builder()
                .id(node2Id)
                .play(play)
                .type(PlayMakerShapeType.PERSON)
                .x(11.0).y(21.0).size(31.0)
                .associatedPlayerId(null)
                .build();

        when(playNodeRepository.findByPlayId(playId)).thenReturn(List.of(node1, node2));

        PlayEdge edge = PlayEdge.builder()
                .id(edgeId)
                .play(play)
                .from(node1)
                .to(node2)
                .build();

        when(playEdgeRepository.findByPlayIdWithNodes(playId)).thenReturn(List.of(edge));
        List<PlayItemDTO> result = teamService.getPlayItems(teamId, playId);

        assertThat(result).hasSize(3);
        assertThat(result).anySatisfy(item -> {
            assertThat(item).isInstanceOf(PersonNodeDTO.class);
            PersonNodeDTO dto = (PersonNodeDTO) item;
            if (dto.id().equals(node1Id)) {
                assertThat(dto.x()).isEqualTo(10.0);
                assertThat(dto.y()).isEqualTo(20.0);
                assertThat(dto.size()).isEqualTo(30.0);
                assertThat(dto.associatedPlayerId()).isEqualTo("p1");
            }
        });

        assertThat(result).anySatisfy(item -> {
            assertThat(item).isInstanceOf(PersonNodeDTO.class);
            PersonNodeDTO dto = (PersonNodeDTO) item;
            if (dto.id().equals(node2Id)) {
                assertThat(dto.x()).isEqualTo(11.0);
                assertThat(dto.y()).isEqualTo(21.0);
                assertThat(dto.size()).isEqualTo(31.0);
                assertThat(dto.associatedPlayerId()).isNull();
            }
        });

        assertThat(result).anySatisfy(item -> {
            assertThat(item).isInstanceOf(ArrowDTO.class);
            ArrowDTO dto = (ArrowDTO) item;
            assertThat(dto.id()).isEqualTo(edgeId);
            assertThat(dto.from().id()).isEqualTo(node1Id);
            assertThat(dto.to().id()).isEqualTo(node2Id);
        });

        verify(teamRepository).findByIdAndDeletedAtIsNull(teamId);
        verify(teamMemberRepository).findByTeamIdAndUserId(teamId, userId);
        verify(playRepository).existsByIdAndTeam_Id(playId, teamId);
        verify(playNodeRepository).findByPlayId(playId);
        verify(playEdgeRepository).findByPlayIdWithNodes(playId);

        verifyNoMoreInteractions(playNodeRepository, playEdgeRepository);
    }

}
