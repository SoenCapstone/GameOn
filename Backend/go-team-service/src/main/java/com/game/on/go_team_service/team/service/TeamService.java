package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.client.UserClient;
import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.mapper.TeamMapper;
import com.game.on.go_team_service.team.metrics.TeamMetricsPublisher;
import com.game.on.go_team_service.team.model.*;
import com.game.on.go_team_service.team.repository.TeamInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.common.dto.UserResponse;
import feign.FeignException;
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
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static com.game.on.go_team_service.team.service.TeamSpecifications.*;
import static java.lang.String.format;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;

    private final TeamMemberRepository teamMemberRepository;

    private final TeamInviteRepository teamInviteRepository;

    private final UserClient userClient;

    private final CurrentUserProvider userProvider;

    private final TeamMapper teamMapper;

    private final TeamMetricsPublisher metricsPublisher;

    @Transactional
    public TeamDetailResponse createTeam(TeamCreateRequest request) {
        String ownerUserId = userProvider.clerkUserId();

        Team team = teamMapper.toTeam(request, ownerUserId);

        var saved = teamRepository.save(team);
        log.info("Team created with teamId {} and ownerId {}", saved.getId(), ownerUserId);
        metricsPublisher.teamCreated();

        TeamMember newMember = teamMapper.toTeamMember(team, ownerUserId, TeamRole.OWNER);
        teamMemberRepository.save(newMember);

        log.info("Team owner {} added to team with ID {}", saved.getId(), ownerUserId);

        return teamMapper.toDetail(saved);
    }

    @Transactional
    public TeamDetailResponse updateTeam(UUID teamId, TeamUpdateRequest request) {
        String userId = userProvider.clerkUserId();
        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, userId);
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
        log.info("Team updated teamId {} byUser {} ", teamId, userId);

        return teamMapper.toDetail(saved);
    }

    @Transactional
    public void archiveTeam(UUID teamId) {
        String userId = userProvider.clerkUserId();

        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, userId);

        if (callerMembership.getRole() != TeamRole.OWNER) {
            throw new ForbiddenException("Only the owner can archive the team");
        }

        team.setDeletedAt(OffsetDateTime.now());
        teamRepository.save(team);
        metricsPublisher.teamArchived();
        log.info("Team {} archived by user {}", teamId, userId);
    }

    @Transactional
    public void removeMember(UUID teamId, String targetMemberId) {
        String userId = userProvider.clerkUserId();

        requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, userId);
        var targetMembership = teamMemberRepository.findByTeamIdAndUserId(teamId, targetMemberId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        if (targetMembership.getRole() == TeamRole.OWNER) {
            throw new ForbiddenException("Cannot remove the team owner");
        }

        ensureRole(callerMembership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                "Only owners or managers can remove other members");
        if (callerMembership.getRole() == TeamRole.MANAGER && targetMembership.getRole() != TeamRole.PLAYER) {
            throw new ForbiddenException("Managers can only remove players");
        }

        teamMemberRepository.delete(targetMembership);
        log.info("Team member {} of teamId {} removed user {}", teamId, targetMemberId, userId);
    }

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeam(UUID teamId) {
        var team = requireActiveTeam(teamId);
        return teamMapper.toDetail(team);
    }

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeamBySlug(String slug) {
        var team = teamRepository.findBySlugIgnoreCaseAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        return teamMapper.toDetail(team);
    }

    @Transactional(readOnly = true)
    public TeamListResponse listTeams(TeamSearchCriteria criteria, int page, int size) {
        String userId = userProvider.clerkUserId();

        int safePage = Math.max(page, 0);
        int effectiveSize = (size <= 0) ? 20 : Math.min(size, 50);

        Pageable pageable = PageRequest.of(
                safePage,
                effectiveSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<Team> spec = null;

        spec = and(spec, notArchived());
        spec = and(spec, withLeague(criteria.leagueId()));
        spec = and(spec, withSport(trimToNull(criteria.sport())));
        spec = and(spec, search(trimToNull(criteria.query())));

        if (criteria.onlyMine()) {
            spec = and(spec, mine(userId));
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
    public List<TeamMemberProfileResponse> listMembers(UUID teamId) {
        requireActiveTeam(teamId);
        return sortMembers(teamMemberRepository.findByTeamId(teamId)).stream()
                .map((member) -> {
                    var user = userClient.getUserById(member.getUserId());
                    return new TeamMemberProfileResponse(
                            member.getUserId(),
                            user.email(),
                            user.firstname(),
                            user.lastname(),
                            member.getRole(),
                            member.getStatus(),
                            member.getJoinedAt()
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamMemberResponse getMyMembership(UUID teamId) {
        String userId = userProvider.clerkUserId();
        requireActiveTeam(teamId);
        var membership = requireActiveMembership(teamId, userId);
        return teamMapper.toMember(membership);
    }

    @Transactional
    public TeamInviteResponse createInvite(TeamInviteCreateRequest request) {
        String userId = userProvider.clerkUserId();
        String inviteeUserId = request.inviteeUserId();
        UUID teamId = request.teamId();

        var team = requireActiveTeam(teamId);
        var callerMembership = requireActiveMembership(teamId, userId);
        ensureRole(callerMembership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                "Only owners or managers can create invites");

        if (inviteeUserId == null) {
            throw new BadRequestException("Either inviteeUserId or inviteeEmail must be provided");
        }

        UserResponse user;
        try {
            user = userClient.getUserById(inviteeUserId);
        } catch (FeignException e) {
            log.error("User service call failed. status={}, body={}", e.status(), e.contentUTF8(), e);
            throw e;
        }


        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, inviteeUserId)) {
            throw new ConflictException(format("User is already a member of the team %s", teamId));
        }

//        enforceRosterLimit(team);

        teamInviteRepository.findByTeamIdAndInviteeUserIdAndStatus(teamId, inviteeUserId, TeamInviteStatus.PENDING)
                .ifPresent(invite -> {
                    throw new ConflictException("An active invite already exists for this user");
                });

        var existingInvite = teamInviteRepository.findByTeamIdAndInviteeUserId(teamId, inviteeUserId);
        if (existingInvite.isPresent()) {
            var invite = existingInvite.get();
            invite.setInvitedByUserId(userId);
            invite.setInviteeEmail(user.email());
            invite.setRole(request.role());
            invite.setStatus(TeamInviteStatus.PENDING);
            invite.setExpiresAt(request.expiresAt());
            invite.setRespondedAt(null);
            invite = teamInviteRepository.save(invite);
            metricsPublisher.inviteSent();
            log.info("Team invite re-sent : teamId {} to user {} by user {}", teamId, invite.getId(), userId);
            return teamMapper.toInviteResponse(invite);
        }

        TeamInvite invite = teamInviteRepository.save(
                teamMapper.toTeamInvite(team, userId, inviteeUserId, user.email(), request.role(), request.expiresAt())
        );
        metricsPublisher.inviteSent();

        log.info("Team invite sent : teamId {} to user {} by user {}", teamId, invite.getId(), userId);
        return teamMapper.toInviteResponse(invite);
    }

    @Transactional(readOnly = true)
    public List<TeamInviteResponse> listTeamInvites(UUID teamId) {
        String userId = userProvider.clerkUserId();
        requireActiveTeam(teamId);
        var membership = requireActiveMembership(teamId, userId);
        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.MANAGER),
                "Only owners or managers can view invites");

        return teamInviteRepository.findByTeamId(teamId).stream()
                .map(teamMapper::toInviteResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamInviteResponse> listUserTeamInvites() {
        return teamInviteRepository.findByInviteeUserId(userProvider.clerkUserId()).stream()
                .map(teamMapper::toInviteResponse)
                .toList();
    }

    @Transactional
    public TeamMemberResponse acceptInvite(TeamInvitationReply reply) {
        String userId = userProvider.clerkUserId();
        UUID invitationId = reply.invitationId();

        log.info("Team invite reply received :  invitationId {} userId {} accept {}", invitationId, userId, reply.isAccepted());

        var invite = teamInviteRepository.findByIdAndStatus(reply.invitationId(), TeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        log.info("Team invite {} is found and not already handled for user {}", invitationId, userId);


        enforceInviteOwnership(invite, userId);
        enforceInviteFresh(invite);

        var team = requireActiveTeam(invite.getTeam().getId());

        if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), userId)) {
            throw new ConflictException("User is already a member of this team");
        }
        log.info("Team member {} does not already exist in team {}", invitationId, userId);

//        enforceRosterLimit(team);

        TeamMember newMember = teamMapper.toTeamMember(team, userId, invite.getRole());
        teamMemberRepository.save(newMember);
        log.info("Team member {} added as PLAYER to team {}", invitationId, userId);

        log.info("Updating status of invitation {}", invitationId);
        invite.setStatus(TeamInviteStatus.ACCEPTED);
        invite.setInviteeUserId(userId);
        invite.setRespondedAt(OffsetDateTime.now());
        teamInviteRepository.save(invite);

        metricsPublisher.inviteAccepted();
        log.info("Team invite {} accepted and updated", invitationId);

        return teamMapper.toMember(newMember);
    }

    @Transactional
    public void declineInvite(TeamInvitationReply reply) {
        String userId = userProvider.clerkUserId();
        UUID invitationId = reply.invitationId();

        var invite = teamInviteRepository.findByIdAndStatus(invitationId, TeamInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found or already handled"));

        enforceInviteOwnership(invite, userId);
        enforceInviteFresh(invite);

        invite.setStatus(TeamInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        invite.setInviteeUserId(invite.getInviteeUserId() == null ? userId : invite.getInviteeUserId());
        teamInviteRepository.save(invite);

        metricsPublisher.inviteDeclined();
        log.info("Team invite declined invitationId {} teamId {} by user {}", invitationId, invite.getTeam().getId(), userId);
    }

    @Transactional
    public TeamDetailResponse transferOwnership(OwnershipTransferRequest request) {
        String userId = userProvider.clerkUserId();
        UUID teamId = request.teamId();
        String newOwnerUserId = request.newOwnerUserId();

        var team = requireActiveTeam(teamId);
        var currentOwnerMembership = requireActiveMembership(teamId, userId);

        if (currentOwnerMembership.getRole() != TeamRole.OWNER) {
            throw new ForbiddenException("Only the current owner can transfer ownership");
        }

        if (newOwnerUserId.equals(userId)) {
            throw new BadRequestException("Cannot transfer ownership to yourself");
        }

        var newOwnerMembership = teamMemberRepository.findByTeamIdAndUserId(teamId, newOwnerUserId)
                .filter(member -> member.getStatus() == TeamMemberStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("New owner must be an active team member"));

        currentOwnerMembership.setRole(TeamRole.MANAGER);
        newOwnerMembership.setRole(TeamRole.OWNER);
        team.setOwnerUserId(newOwnerUserId);

        teamRepository.save(team);
        teamMemberRepository.saveAll(List.of(currentOwnerMembership, newOwnerMembership));

        metricsPublisher.ownershipTransferred();
        log.info("Team owner transferred teamId {} from user {} to user={}", teamId, userId, newOwnerUserId);

        return teamMapper.toDetail(team);
    }

    @Transactional
    public TeamMemberResponse demoteSelfToPlayer(UUID teamId, String userId) {
        requireActiveTeam(teamId);
        var membership = requireActiveMembership(teamId, userId);

        if (membership.getRole() != TeamRole.MANAGER) {
            throw new BadRequestException("Only managers can self-demote to player");
        }

        membership.setRole(TeamRole.PLAYER);
        var saved = teamMemberRepository.save(membership);
        log.info("team_member_self_demoted teamId={} userId={}", teamId, userId);
        return teamMapper.toMember(saved);
    }

    @Transactional
    public TeamMemberResponse demoteManagerToPlayer(UUID teamId, String userId, String targetUserId) {
        requireActiveTeam(teamId);

        TeamMember targetManager = requireActiveMembership(teamId, targetUserId);

        if(targetManager.getRole() != TeamRole.MANAGER){
            throw new BadRequestException("Target user is not a manager");
        }

        var membership = requireActiveMembership(teamId, targetUserId);
        if (membership.getRole() != TeamRole.OWNER) {
            throw new BadRequestException("Only owners can demote managers to players");
        }

        membership.setRole(TeamRole.PLAYER);
        var saved = teamMemberRepository.save(membership);
        log.info("Team member with user id {} was demoted by user {} in team {}", userId, targetUserId, teamId);
        return teamMapper.toMember(saved);
    }

    private Team requireActiveTeam(UUID teamId) {
        return teamRepository.findByIdAndDeletedAtIsNull(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
    }

    private TeamMember requireActiveMembership(UUID teamId, String userId) {
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

    private void enforceInviteOwnership(TeamInvite invite, String userId) {
        if (invite.getInviteeUserId() != null && !invite.getInviteeUserId().equals(userId)) {
            throw new ForbiddenException("Invite is not addressed to this user");
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

    private static <T> Specification<T> and(Specification<T> base, Specification<T> next) {
        if (next == null) return base;
        if (base == null) return next;
        return base.and(next);
    }

}
