package com.game.on.go_league_service.league;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ConflictException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueOrganizerInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueOrganizerResponse;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueOrganizer;
import com.game.on.go_league_service.league.model.LeagueOrganizerInvite;
import com.game.on.go_league_service.league.model.LeagueOrganizerInviteStatus;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.repository.LeagueOrganizerInviteRepository;
import com.game.on.go_league_service.league.repository.LeagueOrganizerRepository;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.service.LeagueOrganizerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeagueOrganizerServiceTest {

    @Mock private LeagueRepository leagueRepository;
    @Mock private LeagueOrganizerRepository organizerRepository;
    @Mock private LeagueOrganizerInviteRepository inviteRepository;
    @Mock private CurrentUserProvider userProvider;

    @InjectMocks private LeagueOrganizerService service;

    private UUID leagueId;
    private League league;
    private final String ownerId = "owner_user";
    private final String organizerId = "organizer_user";
    private final String inviteeId = "invitee_user";
    private final String outsiderId = "outsider_user";

    @BeforeEach
    void setUp() {
        leagueId = UUID.randomUUID();
        league = League.builder()
                .id(leagueId)
                .name("Test League")
                .sport("soccer")
                .slug("test-league")
                .ownerUserId(ownerId)
                .privacy(LeaguePrivacy.PUBLIC)
                .seasonCount(0)
                .build();
    }

    // ── createInvite ────────────────────────────────────────────

    @Test
    void owner_can_create_organizer_invite() {
        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)).thenReturn(false);
        when(inviteRepository.findByLeague_IdAndInviteeUserIdAndStatus(leagueId, inviteeId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.empty());
        when(inviteRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.createInvite(leagueId, new LeagueOrganizerInviteCreateRequest(inviteeId));

        ArgumentCaptor<LeagueOrganizerInvite> captor = ArgumentCaptor.forClass(LeagueOrganizerInvite.class);
        verify(inviteRepository).save(captor.capture());

        LeagueOrganizerInvite saved = captor.getValue();
        assertThat(saved.getInviteeUserId()).isEqualTo(inviteeId);
        assertThat(saved.getInvitedByUserId()).isEqualTo(ownerId);
        assertThat(saved.getStatus()).isEqualTo(LeagueOrganizerInviteStatus.PENDING);
    }

    @Test
    void cannot_invite_the_league_owner_as_organizer() {
        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));

        assertThatThrownBy(() ->
                service.createInvite(leagueId, new LeagueOrganizerInviteCreateRequest(ownerId))
        ).isInstanceOf(ConflictException.class);

        verify(inviteRepository, never()).save(any());
    }

    @Test
    void cannot_invite_existing_organizer() {
        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)).thenReturn(true);

        assertThatThrownBy(() ->
                service.createInvite(leagueId, new LeagueOrganizerInviteCreateRequest(inviteeId))
        ).isInstanceOf(ConflictException.class);

        verify(inviteRepository, never()).save(any());
    }

    @Test
    void cannot_create_duplicate_pending_invite() {
        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)).thenReturn(false);
        when(inviteRepository.findByLeague_IdAndInviteeUserIdAndStatus(leagueId, inviteeId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(LeagueOrganizerInvite.builder().build()));

        assertThatThrownBy(() ->
                service.createInvite(leagueId, new LeagueOrganizerInviteCreateRequest(inviteeId))
        ).isInstanceOf(ConflictException.class);

        verify(inviteRepository, never()).save(any());
    }

    @Test
    void outsider_cannot_create_invite() {
        when(userProvider.clerkUserId()).thenReturn(outsiderId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, outsiderId)).thenReturn(false);

        assertThatThrownBy(() ->
                service.createInvite(leagueId, new LeagueOrganizerInviteCreateRequest(inviteeId))
        ).isInstanceOf(ForbiddenException.class);

        verify(inviteRepository, never()).save(any());
    }

    // ── acceptInvite ────────────────────────────────────────────

    @Test
    void invitee_can_accept_invite() {
        UUID inviteId = UUID.randomUUID();
        LeagueOrganizerInvite invite = LeagueOrganizerInvite.builder()
                .id(inviteId)
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(inviteeId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)).thenReturn(false);
        when(organizerRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(inviteRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.acceptInvite(inviteId);

        ArgumentCaptor<LeagueOrganizer> orgCaptor = ArgumentCaptor.forClass(LeagueOrganizer.class);
        verify(organizerRepository).save(orgCaptor.capture());
        assertThat(orgCaptor.getValue().getUserId()).isEqualTo(inviteeId);
        assertThat(orgCaptor.getValue().getLeague().getId()).isEqualTo(leagueId);

        assertThat(invite.getStatus()).isEqualTo(LeagueOrganizerInviteStatus.ACCEPTED);
        assertThat(invite.getRespondedAt()).isNotNull();
    }

    @Test
    void non_invitee_cannot_accept_invite() {
        UUID inviteId = UUID.randomUUID();
        LeagueOrganizerInvite invite = LeagueOrganizerInvite.builder()
                .id(inviteId)
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(outsiderId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> service.acceptInvite(inviteId))
                .isInstanceOf(ForbiddenException.class);

        verify(organizerRepository, never()).save(any());
    }

    @Test
    void accept_throws_not_found_for_missing_invite() {
        UUID inviteId = UUID.randomUUID();
        when(userProvider.clerkUserId()).thenReturn(inviteeId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.acceptInvite(inviteId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void accept_throws_conflict_if_already_organizer() {
        UUID inviteId = UUID.randomUUID();
        LeagueOrganizerInvite invite = LeagueOrganizerInvite.builder()
                .id(inviteId)
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(inviteeId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)).thenReturn(true);

        assertThatThrownBy(() -> service.acceptInvite(inviteId))
                .isInstanceOf(ConflictException.class);

        verify(organizerRepository, never()).save(any());
    }

    // ── declineInvite ───────────────────────────────────────────

    @Test
    void invitee_can_decline_invite() {
        UUID inviteId = UUID.randomUUID();
        LeagueOrganizerInvite invite = LeagueOrganizerInvite.builder()
                .id(inviteId)
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(inviteeId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));
        when(inviteRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.declineInvite(inviteId);

        assertThat(invite.getStatus()).isEqualTo(LeagueOrganizerInviteStatus.DECLINED);
        assertThat(invite.getRespondedAt()).isNotNull();
        verify(organizerRepository, never()).save(any());
    }

    @Test
    void non_invitee_cannot_decline_invite() {
        UUID inviteId = UUID.randomUUID();
        LeagueOrganizerInvite invite = LeagueOrganizerInvite.builder()
                .id(inviteId)
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(outsiderId);
        when(inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));

        assertThatThrownBy(() -> service.declineInvite(inviteId))
                .isInstanceOf(ForbiddenException.class);
    }

    // ── removeOrganizer ─────────────────────────────────────────

    @Test
    void owner_can_remove_organizer() {
        LeagueOrganizer organizer = LeagueOrganizer.builder()
                .id(UUID.randomUUID())
                .league(league)
                .userId(organizerId)
                .joinedAt(OffsetDateTime.now())
                .build();

        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.findByLeague_IdAndUserId(leagueId, organizerId))
                .thenReturn(Optional.of(organizer));

        service.removeOrganizer(leagueId, organizerId);

        verify(organizerRepository).delete(organizer);
    }

    @Test
    void non_owner_cannot_remove_organizer() {
        when(userProvider.clerkUserId()).thenReturn(organizerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));

        assertThatThrownBy(() -> service.removeOrganizer(leagueId, inviteeId))
                .isInstanceOf(ForbiddenException.class);

        verify(organizerRepository, never()).delete(any());
    }

    @Test
    void remove_throws_not_found_for_missing_organizer() {
        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.findByLeague_IdAndUserId(leagueId, inviteeId))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.removeOrganizer(leagueId, inviteeId))
                .isInstanceOf(NotFoundException.class);
    }

    // ── listOrganizers ──────────────────────────────────────────

    @Test
    void list_organizers_returns_mapped_responses() {
        LeagueOrganizer org1 = LeagueOrganizer.builder()
                .id(UUID.randomUUID())
                .league(league)
                .userId(organizerId)
                .joinedAt(OffsetDateTime.now())
                .build();

        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.findByLeague_IdOrderByJoinedAtAsc(leagueId))
                .thenReturn(List.of(org1));

        List<LeagueOrganizerResponse> result = service.listOrganizers(leagueId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).userId()).isEqualTo(organizerId);
        assertThat(result.get(0).leagueId()).isEqualTo(leagueId);
    }

    @Test
    void list_organizers_throws_not_found_for_archived_league() {
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listOrganizers(leagueId))
                .isInstanceOf(NotFoundException.class);
    }

    // ── listPendingInviteeIds ───────────────────────────────────

    @Test
    void list_pending_invitee_ids_returns_user_ids() {
        LeagueOrganizerInvite inv1 = LeagueOrganizerInvite.builder()
                .id(UUID.randomUUID())
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(ownerId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build();

        when(userProvider.clerkUserId()).thenReturn(ownerId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(inviteRepository.findByLeague_IdAndStatusOrderByCreatedAtDesc(leagueId, LeagueOrganizerInviteStatus.PENDING))
                .thenReturn(List.of(inv1));

        List<String> result = service.listPendingInviteeIds(leagueId);

        assertThat(result).containsExactly(inviteeId);
    }

    @Test
    void list_pending_invitee_ids_rejects_outsider() {
        when(userProvider.clerkUserId()).thenReturn(outsiderId);
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, outsiderId)).thenReturn(false);

        assertThatThrownBy(() -> service.listPendingInviteeIds(leagueId))
                .isInstanceOf(ForbiddenException.class);
    }

    // ── isOwnerOrOrganizer ──────────────────────────────────────

    @Test
    void isOwnerOrOrganizer_returns_true_for_owner() {
        assertThat(service.isOwnerOrOrganizer(league, ownerId)).isTrue();
        verify(organizerRepository, never()).existsByLeague_IdAndUserId(any(), any());
    }

    @Test
    void isOwnerOrOrganizer_returns_true_for_organizer() {
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, organizerId)).thenReturn(true);

        assertThat(service.isOwnerOrOrganizer(league, organizerId)).isTrue();
    }

    @Test
    void isOwnerOrOrganizer_returns_false_for_outsider() {
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, outsiderId)).thenReturn(false);

        assertThat(service.isOwnerOrOrganizer(league, outsiderId)).isFalse();
    }

    @Test
    void ensureOwnerOrOrganizer_throws_for_outsider() {
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, outsiderId)).thenReturn(false);

        assertThatThrownBy(() -> service.ensureOwnerOrOrganizer(league, outsiderId))
                .isInstanceOf(ForbiddenException.class);
    }
}