package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.external.UserDirectoryClient;
import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.mapper.TeamMapper;
import com.game.on.go_team_service.team.metrics.TeamMetricsPublisher;
import com.game.on.go_team_service.team.model.*;
import com.game.on.go_team_service.team.repository.TeamInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.go_team_service.team.util.SlugGenerator;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static com.game.on.go_team_service.team.service.TeamSpecifications.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private static final int DEFAULT_INVITE_EXPIRY_DAYS = 7;

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final TeamMapper teamMapper;
    private final TeamMetricsPublisher metricsPublisher;
    private final UserDirectoryClient userDirectoryClient;

    @Transactional
    public TeamDetailResponse createTeam(TeamCreateRequest request, Long callerId) {
        var team = Team.builder()
                .name(request.name().trim())
                .sport(trimToNull(request.sport()))
//                .leagueId(request.leagueId())
                .scope(trimToNull(request.scope()))
                .ownerUserId(callerId)
                .slug(generateUniqueSlug(request.name()))
                .logoUrl(trimToNull(request.logoUrl()))
                .location(trimToNull(request.location()))
//                .maxRoster(request.maxRoster())
                .privacy(request.privacy() == null ? TeamPrivacy.PUBLIC : request.privacy())
                .build();

//        validateMaxRoster(team.getMaxRoster());
//
//        var ownerMember = TeamMember.builder()
//                .team(team)
//                .userId(callerId)
//                .role(TeamRole.OWNER)
//                .status(TeamMemberStatus.ACTIVE)
//                .joinedAt(OffsetDateTime.now())
//                .build();
//
//        team.getMembers().add(ownerMember);

        var saved = teamRepository.save(team);
        metricsPublisher.teamCreated();
        log.info("team_created teamId={} ownerId={}", saved.getId(), callerId);

//        var members = sortMembers(teamMemberRepository.findByTeamId(saved.getId()));
        return teamMapper.toDetail(saved, List.of());
    }

    @Transactional
    public TeamDetailResponse updateTeam(UUID teamId, TeamUpdateRequest request, Long callerId) {
        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, callerId);
        ensureRole(callerMembership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                "Only owners or managers can update team");

        if (requestEqualsNoChange(request)) {
            throw new BadRequestException("At least one field must be provided for update");
        }

        if (StringUtils.hasText(request.name())) {
            team.setName(request.name().trim());
        }
        if (StringUtils.hasText(request.sport())) {
            team.setSport(request.sport().trim());
        }
//        if (request.leagueId() != null) {
//            team.setLeagueId(request.leagueId());
//        }
        if (StringUtils.hasText(request.scope())) {
            team.setScope(request.scope().trim());
        }
        if (request.logoUrl() != null) {
            team.setLogoUrl(trimToNull(request.logoUrl()));
        }
        if (request.location() != null) {
            team.setLocation(trimToNull(request.location()));
        }
//        if (request.maxRoster() != null) {
//            validateMaxRoster(request.maxRoster());
//            var activeCount = teamMemberRepository.countByTeamIdAndStatus(teamId, TeamMemberStatus.ACTIVE);
//           if (request.maxRoster() < activeCount) {
//                throw new BadRequestException("maxRoster cannot be less than current active members");
//            }
//            team.setMaxRoster(request.maxRoster());
//        }
        if (request.privacy() != null) {
            team.setPrivacy(request.privacy());
        }

        var saved = teamRepository.save(team);
        log.info("team_updated teamId={} byUser={} ", teamId, callerId);

        var members = sortMembers(teamMemberRepository.findByTeamId(teamId));
        return teamMapper.toDetail(saved, members);
    }

    @Transactional
    public void archiveTeam(UUID teamId, Long callerId) {
        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, callerId);

        if (callerMembership.getRole() != TeamRole.OWNER) {
            throw new ForbiddenException("Only the owner can archive the team");
        }
        team.setDeletedAt(OffsetDateTime.now());
        teamRepository.save(team);
        metricsPublisher.teamArchived();
        log.info("team_archived teamId={} byUser={}", teamId, callerId);
    }

    @Transactional
    public void removeMember(UUID teamId, Long memberUserId, Long callerId) {
        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, callerId);
        var targetMembership = teamMemberRepository.findByTeamIdAndUserId(teamId, memberUserId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        if (targetMembership.getRole() == TeamRole.OWNER) {
            if (memberUserId.equals(callerId)) {
                throw new BadRequestException("Owner cannot leave their own team");
            }
            throw new ForbiddenException("Cannot remove the team owner");
        }

        if (!memberUserId.equals(callerId)) {
            ensureRole(callerMembership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                    "Only owners or managers can remove other members");
            if (callerMembership.getRole() == TeamRole.MANAGER && targetMembership.getRole() != TeamRole.PLAYER) {
                throw new ForbiddenException("Managers can only remove players");
            }
        }

        teamMemberRepository.delete(targetMembership);
        log.info("team_member_removed teamId={} removedUser={} byUser={}", teamId, memberUserId, callerId);
    }

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeam(UUID teamId) {
        var team = requireActiveTeam(teamId);
        var members = sortMembers(teamMemberRepository.findByTeamId(teamId));
        return teamMapper.toDetail(team, members);
    }

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeamBySlug(String slug) {
        var team = teamRepository.findBySlugIgnoreCaseAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        var members = sortMembers(teamMemberRepository.findByTeamId(team.getId()));
        return teamMapper.toDetail(team, members);
    }

    @Transactional(readOnly = true)
    public TeamListResponse listTeams(TeamSearchCriteria criteria, int page, int size, Long callerId) {
        int safePage = Math.max(page, 0);
        int effectiveSize = size <= 0 ? 20 : Math.min(size, 50);
        Pageable pageable = PageRequest.of(safePage, effectiveSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Team> spec = Specification.where(notArchived())
                .and(withLeague(criteria.leagueId()))
                .and(withSport(trimToNull(criteria.sport())))
                .and(search(trimToNull(criteria.query())));

        if (criteria.onlyMine()) {
            spec = spec.and(mine(callerId));
        }

        var pageResult = teamRepository.findAll(spec, pageable);
        var summaries = pageResult.stream().map(teamMapper::toSummary).toList();

        return new TeamListResponse(
                summaries,
                pageResult.getTotalElements(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> listMembers(UUID teamId, Long callerId) {
        requireActiveTeam(teamId);
        requireActiveMembership(teamId, callerId);
        return sortMembers(teamMemberRepository.findByTeamId(teamId)).stream()
                .map(teamMapper::toMember)
                .toList();
    }

//    @Transactional
//    public TeamInviteResponse createInvite(UUID teamId, TeamInviteCreateRequest request, Long callerId) {
//        var team = requireActiveTeam(teamId);
//        var callerMembership = requireActiveMembership(teamId, callerId);
//        ensureRole(callerMembership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
//                "Only owners or managers can create invites");
//
//        var inviteeUserId = request.inviteeUserId();
//        var inviteeEmail = trimToNull(request.inviteeEmail());
//
//        if (inviteeUserId == null && inviteeEmail == null) {
//            throw new BadRequestException("Either inviteeUserId or inviteeEmail must be provided");
//        }
//
//        if (inviteeUserId != null && !userDirectoryClient.userExists(inviteeUserId)) {
//            throw new NotFoundException("Invitee user not found");
//        }
//
//        if (inviteeUserId != null && teamMemberRepository.existsByTeamIdAndUserId(teamId, inviteeUserId)) {
//            throw new ConflictException("User is already a member");
//        }
//
//        enforceRosterLimit(team);
//
//        if (inviteeUserId != null) {
//            teamInviteRepository.findByTeamIdAndInviteeUserIdAndStatus(teamId, inviteeUserId, TeamInviteStatus.PENDING)
//                    .ifPresent(invite -> {
//                        throw new ConflictException("An active invite already exists for this user");
//                    });
//        }
//
//        if (inviteeEmail != null) {
//            teamInviteRepository.findByTeamIdAndInviteeEmailIgnoreCaseAndStatus(teamId, inviteeEmail, TeamInviteStatus.PENDING)
//                    .ifPresent(invite -> {
//                        throw new ConflictException("An active invite already exists for this email");
//                    });
//        }
//
//        var expiresAt = request.expiresAt();
//        if (expiresAt == null) {
//            expiresAt = OffsetDateTime.now().plusDays(DEFAULT_INVITE_EXPIRY_DAYS);
//        }
//
//        var invite = TeamInvite.builder()
//                .team(team)
//                .invitedByUserId(callerId)
//                .inviteeUserId(inviteeUserId)
//                .inviteeEmail(inviteeEmail)
//                .expiresAt(expiresAt.truncatedTo(ChronoUnit.SECONDS))
//                .status(TeamInviteStatus.PENDING)
//                .build();
//
//        var saved = teamInviteRepository.save(invite);
//        metricsPublisher.inviteSent();
//        log.info("team_invite_sent teamId={} inviteId={} byUser={}", teamId, saved.getId(), callerId);
//        return teamMapper.toInviteResponse(saved);
//    }

    @Transactional(readOnly = true)
    public List<TeamInviteResponse> listInvites(UUID teamId, Long callerId) {
        requireActiveTeam(teamId);
        var membership = requireActiveMembership(teamId, callerId);
        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                "Only owners or managers can view invites");

        return teamInviteRepository.findByTeamId(teamId).stream()
                .map(teamMapper::toInviteResponse)
                .toList();
    }

    @Transactional
    public TeamMemberResponse acceptInvite(UUID inviteId, Long callerId, Optional<String> callerEmail) {
        var invite = teamInviteRepository.findByIdAndStatus(inviteId, TeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        enforceInviteOwnership(invite, callerId, callerEmail);
        enforceInviteFresh(invite);

        var team = requireActiveTeam(invite.getTeam().getId());

        if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), callerId)) {
            throw new ConflictException("User is already a member of this team");
        }

//        enforceRosterLimit(team);

        var newMember = TeamMember.builder()
                .team(team)
                .userId(callerId)
                .role(TeamRole.PLAYER)
                .status(TeamMemberStatus.ACTIVE)
                .joinedAt(OffsetDateTime.now())
                .build();
        teamMemberRepository.save(newMember);

        invite.setStatus(TeamInviteStatus.ACCEPTED);
        invite.setInviteeUserId(invite.getInviteeUserId() == null ? callerId : invite.getInviteeUserId());
        invite.setRespondedAt(OffsetDateTime.now());
        teamInviteRepository.save(invite);

        metricsPublisher.inviteAccepted();
        log.info("team_invite_accepted inviteId={} teamId={} byUser={}", inviteId, team.getId(), callerId);

        return teamMapper.toMember(newMember);
    }

    @Transactional
    public void declineInvite(UUID inviteId, Long callerId, Optional<String> callerEmail) {
        var invite = teamInviteRepository.findByIdAndStatus(inviteId, TeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        enforceInviteOwnership(invite, callerId, callerEmail);
        enforceInviteFresh(invite);

        invite.setStatus(TeamInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        invite.setInviteeUserId(invite.getInviteeUserId() == null ? callerId : invite.getInviteeUserId());
        teamInviteRepository.save(invite);

        metricsPublisher.inviteDeclined();
        log.info("team_invite_declined inviteId={} teamId={} byUser={}", inviteId, invite.getTeam().getId(), callerId);
    }

    @Transactional
    public TeamDetailResponse transferOwnership(UUID teamId, Long newOwnerUserId, Long callerId) {
        var team = requireActiveTeam(teamId);
        var currentOwnerMembership = requireActiveMembership(teamId, callerId);

        if (currentOwnerMembership.getRole() != TeamRole.OWNER) {
            throw new ForbiddenException("Only the current owner can transfer ownership");
        }

        if (newOwnerUserId.equals(callerId)) {
            throw new BadRequestException("Cannot transfer ownership to yourself");
        }

        var newOwnerMembership = teamMemberRepository.findByTeamIdAndUserId(teamId, newOwnerUserId)
                .filter(member -> member.getStatus() == TeamMemberStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("New owner must be an active team member"));

        currentOwnerMembership.setRole(TeamRole.MANAGER);
        newOwnerMembership.setRole(TeamRole.OWNER);
        team.setOwnerUserId(newOwnerUserId);

        teamRepository.save(team);
        teamMemberRepository.save(currentOwnerMembership);
        teamMemberRepository.save(newOwnerMembership);

        metricsPublisher.ownershipTransferred();
        log.info("team_owner_transferred teamId={} fromUser={} toUser={}", teamId, callerId, newOwnerUserId);

        var members = sortMembers(teamMemberRepository.findByTeamId(teamId));
        return teamMapper.toDetail(team, members);
    }

    @Transactional
    public TeamMemberResponse demoteSelfToPlayer(UUID teamId, Long callerId) {
        requireActiveTeam(teamId);
        var membership = requireActiveMembership(teamId, callerId);

        if (membership.getRole() != TeamRole.MANAGER) {
            throw new BadRequestException("Only managers can self-demote to player");
        }

        membership.setRole(TeamRole.PLAYER);
        var saved = teamMemberRepository.save(membership);
        log.info("team_member_self_demoted teamId={} userId={}", teamId, callerId);
        return teamMapper.toMember(saved);
    }

    private Team requireActiveTeam(UUID teamId) {
        return teamRepository.findByIdAndDeletedAtIsNull(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
    }

    private TeamMember requireActiveMembership(UUID teamId, Long userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .filter(member -> member.getStatus() == TeamMemberStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("You are not an active member of this team"));
    }

    private void ensureRole(TeamMember membership, Set<TeamRole> allowedRoles, String message) {
        if (!allowedRoles.contains(membership.getRole())) {
            throw new ForbiddenException(message);
        }
    }

//    private void enforceRosterLimit(Team team) {
//        if (team.getMaxRoster() == null) {
//            return;
//        }
//        var activeCount = teamMemberRepository.countByTeamIdAndStatus(team.getId(), TeamMemberStatus.ACTIVE);
//        if (activeCount >= team.getMaxRoster()) {
//            throw new BadRequestException("Team roster is full");
//        }
//    }

    private void enforceInviteOwnership(TeamInvite invite, Long callerId, Optional<String> callerEmail) {
        if (invite.getInviteeUserId() != null && !invite.getInviteeUserId().equals(callerId)) {
            throw new ForbiddenException("Invite is not addressed to this user");
        }
        if (invite.getInviteeEmail() != null) {
            var matches = callerEmail.map(email -> email.equalsIgnoreCase(invite.getInviteeEmail()))
                    .orElse(false);
            if (!matches && invite.getInviteeUserId() == null) {
                throw new ForbiddenException("Invite is not addressed to this user");
            }
        }
    }

    private List<TeamMember> sortMembers(List<TeamMember> members) {
        return members.stream()
                .sorted(Comparator
                        .comparing(TeamMember::getRole, (r1, r2) -> Integer.compare(roleWeight(r1), roleWeight(r2)))
                        .thenComparing(TeamMember::getJoinedAt))
                .toList();
    }

    private int roleWeight(TeamRole role) {
        return switch (role) {
            case OWNER -> 0;
            case MANAGER -> 1;
            default -> 2;
        };
    }

    private void enforceInviteFresh(TeamInvite invite) {
        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            invite.setStatus(TeamInviteStatus.EXPIRED);
            teamInviteRepository.save(invite);
            throw new BadRequestException("Invite has expired");
        }
    }

    private String generateUniqueSlug(String name) {
        var baseSlug = SlugGenerator.from(name);
        if (!StringUtils.hasText(baseSlug)) {
            throw new BadRequestException("Unable to generate team slug");
        }
        var slug = baseSlug;
        int suffix = 1;
        while (teamRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix++;
        }
        return slug;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private void validateMaxRoster(Integer maxRoster) {
        if (maxRoster != null && maxRoster <= 0) {
            throw new BadRequestException("maxRoster must be greater than 0");
        }
    }

    private boolean requestEqualsNoChange(TeamUpdateRequest request) {
        return request.name() == null && request.sport() == null
                && request.logoUrl() == null && request.location() == null
                && request.privacy() == null;
    }
}
