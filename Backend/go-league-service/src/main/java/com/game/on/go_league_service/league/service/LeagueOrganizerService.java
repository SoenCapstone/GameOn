package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ConflictException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueOrganizerInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueOrganizerInviteResponse;
import com.game.on.go_league_service.league.dto.LeagueOrganizerResponse;
import com.game.on.go_league_service.league.model.*;
import com.game.on.go_league_service.league.repository.LeagueOrganizerInviteRepository;
import com.game.on.go_league_service.league.repository.LeagueOrganizerRepository;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeagueOrganizerService {

    private final LeagueRepository leagueRepository;
    private final LeagueOrganizerRepository organizerRepository;
    private final LeagueOrganizerInviteRepository inviteRepository;
    private final CurrentUserProvider userProvider;

    @Transactional
    public void createInvite(UUID leagueId, LeagueOrganizerInviteCreateRequest request) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);
        ensureOwnerOrOrganizer(league, userId);

        String inviteeId = request.inviteeUserId();

        if (inviteeId.equals(league.getOwnerUserId())) {
            throw new ConflictException("The league owner cannot be invited as an organizer");
        }
        if (organizerRepository.existsByLeague_IdAndUserId(leagueId, inviteeId)) {
            throw new ConflictException("User is already an organizer");
        }
        inviteRepository.findByLeague_IdAndInviteeUserIdAndStatus(
                leagueId, inviteeId, LeagueOrganizerInviteStatus.PENDING
        ).ifPresent(e -> {
            throw new ConflictException("A pending invite already exists for this user");
        });

        inviteRepository.save(LeagueOrganizerInvite.builder()
                .league(league)
                .inviteeUserId(inviteeId)
                .invitedByUserId(userId)
                .status(LeagueOrganizerInviteStatus.PENDING)
                .build());

        log.info("league_organizer_invite_created league={} invitee={} by={}",
                leagueId, inviteeId, userId);
    }

    @Transactional
    public void acceptInvite(UUID inviteId) {
        String userId = userProvider.clerkUserId();
        var invite = inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        if (!invite.getInviteeUserId().equals(userId)) {
            throw new ForbiddenException("You can only accept your own invites");
        }

        UUID leagueId = invite.getLeague().getId();
        if (organizerRepository.existsByLeague_IdAndUserId(leagueId, userId)) {
            throw new ConflictException("Already an organizer of this league");
        }

        organizerRepository.save(LeagueOrganizer.builder()
                .league(invite.getLeague())
                .userId(userId)
                .build());

        invite.setStatus(LeagueOrganizerInviteStatus.ACCEPTED);
        invite.setRespondedAt(OffsetDateTime.now());
        inviteRepository.save(invite);

        log.info("league_organizer_invite_accepted invite={} league={} user={}",
                inviteId, leagueId, userId);
    }

    @Transactional
    public void declineInvite(UUID inviteId) {
        String userId = userProvider.clerkUserId();
        var invite = inviteRepository.findByIdAndStatus(inviteId, LeagueOrganizerInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        if (!invite.getInviteeUserId().equals(userId)) {
            throw new ForbiddenException("You can only decline your own invites");
        }

        invite.setStatus(LeagueOrganizerInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        inviteRepository.save(invite);

        log.info("league_organizer_invite_declined invite={} league={} user={}",
                inviteId, invite.getLeague().getId(), userId);
    }

    @Transactional(readOnly = true)
    public List<LeagueOrganizerResponse> listOrganizers(UUID leagueId) {
        requireActiveLeague(leagueId);
        return organizerRepository.findByLeague_IdOrderByJoinedAtAsc(leagueId)
                .stream()
                .map(o -> new LeagueOrganizerResponse(
                        o.getId(), o.getLeague().getId(),
                        o.getUserId(), o.getJoinedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> listPendingInviteeIds(UUID leagueId) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);
        ensureOwnerOrOrganizer(league, userId);
        return inviteRepository
                .findByLeague_IdAndStatusOrderByCreatedAtDesc(leagueId, LeagueOrganizerInviteStatus.PENDING)
                .stream()
                .map(LeagueOrganizerInvite::getInviteeUserId)
                .toList();
    }

    @Transactional
    public void removeOrganizer(UUID leagueId, String targetUserId) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);

        if (!league.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the league owner can remove organizers");
        }

        var organizer = organizerRepository.findByLeague_IdAndUserId(leagueId, targetUserId)
                .orElseThrow(() -> new NotFoundException("Organizer not found"));

        organizerRepository.delete(organizer);
        log.info("league_organizer_removed league={} target={} by={}",
                leagueId, targetUserId, userId);
    }

    /**
     * Returns true if userId is either the league owner or an active organizer.
     * This is the method that other services should call to replace their
     * owner-only checks when organizers should also be allowed.
     */
    public boolean isOwnerOrOrganizer(League league, String userId) {
        if (league.getOwnerUserId().equals(userId)) return true;
        return organizerRepository.existsByLeague_IdAndUserId(league.getId(), userId);
    }

    public void ensureOwnerOrOrganizer(League league, String userId) {
        if (!isOwnerOrOrganizer(league, userId)) {
            throw new ForbiddenException("Only the league owner or organizers can perform this action");
        }
    }

    @Transactional(readOnly = true)
    public List<LeagueOrganizerInviteResponse> listMyPendingInvites() {
        String userId = userProvider.clerkUserId();
        return inviteRepository.findByInviteeUserIdAndStatusOrderByCreatedAtDesc(userId, LeagueOrganizerInviteStatus.PENDING)
                .stream()
                .map(i -> new LeagueOrganizerInviteResponse(
                        i.getId(),
                        i.getLeague().getId(),
                        i.getInviteeUserId(),
                        i.getInvitedByUserId(),
                        i.getStatus().name(),
                        i.getCreatedAt(),
                        i.getRespondedAt()))
                .toList();
    }

    private League requireActiveLeague(UUID leagueId) {
        return leagueRepository.findByIdAndArchivedAtIsNull(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
    }
}