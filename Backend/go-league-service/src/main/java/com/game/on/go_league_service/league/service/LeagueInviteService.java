package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.client.dto.TeamMembershipResponse;
import com.game.on.go_league_service.client.dto.TeamSummaryResponse;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ConflictException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.exception.UnauthorizedException;
import com.game.on.go_league_service.league.dto.LeagueTeamInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueTeamInviteResponse;
import com.game.on.go_league_service.league.mapper.LeagueTeamInviteMapper;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueTeam;
import com.game.on.go_league_service.league.model.LeagueTeamInvite;
import com.game.on.go_league_service.league.model.LeagueTeamInviteStatus;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueTeamInviteRepository;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeagueInviteService {

    private static final Set<String> TEAM_ADMIN_ROLES = Set.of("OWNER", "MANAGER");

    private final LeagueRepository leagueRepository;
    private final LeagueTeamRepository leagueTeamRepository;
    private final LeagueTeamInviteRepository leagueTeamInviteRepository;
    private final LeagueTeamInviteMapper leagueTeamInviteMapper;
    private final CurrentUserProvider userProvider;
    private final TeamClient teamClient;

    @Transactional
    public LeagueTeamInviteResponse createInvite(UUID leagueId, LeagueTeamInviteCreateRequest request) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureLeagueOwner(league, userId);

        var team = requireTeam(request.teamId());
        ensureSportCompatibility(league, team);
        ensureTeamNotInLeague(leagueId, request.teamId());

        leagueTeamInviteRepository.findByLeague_IdAndTeamIdAndStatus(
                leagueId,
                request.teamId(),
                LeagueTeamInviteStatus.PENDING
        ).ifPresent(invite -> {
            throw new ConflictException("An active invite already exists for this team");
        });

        LeagueTeamInvite invite = LeagueTeamInvite.builder()
                .league(league)
                .teamId(request.teamId())
                .invitedByUserId(userId)
                .status(LeagueTeamInviteStatus.PENDING)
                .build();

        var saved = leagueTeamInviteRepository.save(invite);
        log.info("league_team_invite_created leagueId={} teamId={} inviteId={} byUser={}",
                leagueId, request.teamId(), saved.getId(), userId);

        return leagueTeamInviteMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeagueTeamInviteResponse> listInvitesForTeam(UUID teamId) {
        ensureTeamAdmin(teamId);
        return leagueTeamInviteRepository
                .findByTeamIdAndStatusOrderByCreatedAtDesc(teamId, LeagueTeamInviteStatus.PENDING)
                .stream()
                .map(leagueTeamInviteMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeagueTeamInviteResponse> listInvitesForLeague(UUID leagueId, LeagueTeamInviteStatus status) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureLeagueOwner(league, userId);
        var effectiveStatus = status == null ? LeagueTeamInviteStatus.PENDING : status;
        return leagueTeamInviteRepository
                .findByLeague_IdAndStatusOrderByCreatedAtDesc(leagueId, effectiveStatus)
                .stream()
                .map(leagueTeamInviteMapper::toResponse)
                .toList();
    }

    @Transactional
    public LeagueTeamInviteResponse acceptInvite(UUID inviteId) {
        String userId = userProvider.clerkUserId();
        var invite = leagueTeamInviteRepository.findByIdAndStatus(inviteId, LeagueTeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        ensureTeamAdmin(invite.getTeamId());
        ensureTeamNotInLeague(invite.getLeague().getId(), invite.getTeamId());

        LeagueTeam leagueTeam = LeagueTeam.builder()
                .league(invite.getLeague())
                .teamId(invite.getTeamId())
                .build();
        leagueTeamRepository.save(leagueTeam);

        invite.setStatus(LeagueTeamInviteStatus.ACCEPTED);
        invite.setRespondedAt(OffsetDateTime.now());
        leagueTeamInviteRepository.save(invite);

        log.info("league_team_invite_accepted inviteId={} leagueId={} teamId={} byUser={}",
                inviteId, invite.getLeague().getId(), invite.getTeamId(), userId);

        return leagueTeamInviteMapper.toResponse(invite);
    }

    @Transactional
    public void declineInvite(UUID inviteId) {
        String userId = userProvider.clerkUserId();
        var invite = leagueTeamInviteRepository.findByIdAndStatus(inviteId, LeagueTeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        ensureTeamAdmin(invite.getTeamId());

        invite.setStatus(LeagueTeamInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        leagueTeamInviteRepository.save(invite);

        log.info("league_team_invite_declined inviteId={} leagueId={} teamId={} byUser={}",
                inviteId, invite.getLeague().getId(), invite.getTeamId(), userId);
    }

    private League requireActiveLeague(UUID leagueId) {
        return leagueRepository.findByIdAndArchivedAtIsNull(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
    }

    private void ensureLeagueOwner(League league, String userId) {
        if (!league.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the league owner can invite teams");
        }
    }

    private void ensureTeamNotInLeague(UUID leagueId, UUID teamId) {
        if (leagueTeamRepository.existsByLeague_IdAndTeamId(leagueId, teamId)) {
            throw new ConflictException("Team is already part of this league");
        }
    }

    private TeamSummaryResponse requireTeam(UUID teamId) {
        try {
            return teamClient.getTeam(teamId);
        } catch (FeignException.NotFound ex) {
            throw new NotFoundException("Team not found");
        } catch (FeignException.Unauthorized ex) {
            throw new UnauthorizedException("Unauthorized");
        } catch (FeignException.Forbidden ex) {
            throw new ForbiddenException("Not allowed to access team details");
        } catch (FeignException ex) {
            log.error("Team service call failed. status={}, body={}", ex.status(), ex.contentUTF8(), ex);
            throw ex;
        }
    }

    private void ensureSportCompatibility(League league, TeamSummaryResponse team) {
        var leagueSport = normalizeSport(league.getSport());
        var teamSport = normalizeSport(team.sport());
        if (leagueSport == null || teamSport == null || !leagueSport.equals(teamSport)) {
            throw new BadRequestException("Team sport does not match league sport");
        }
    }

    private String normalizeSport(String sport) {
        return sport == null ? null : sport.trim().toLowerCase();
    }

    private void ensureTeamAdmin(UUID teamId) {
        TeamMembershipResponse membership;
        try {
            membership = teamClient.getMyMembership(teamId);
        } catch (FeignException.NotFound ex) {
            throw new NotFoundException("Team not found");
        } catch (FeignException.Unauthorized ex) {
            throw new UnauthorizedException("Unauthorized");
        } catch (FeignException.Forbidden ex) {
            throw new ForbiddenException("You are not an active member of this team");
        } catch (FeignException ex) {
            log.error("Team service call failed. status={}, body={}", ex.status(), ex.contentUTF8(), ex);
            throw ex;
        }

        if (membership.role() == null || !TEAM_ADMIN_ROLES.contains(membership.role())) {
            throw new ForbiddenException("Only team owners or managers can manage league invites");
        }
    }
}
