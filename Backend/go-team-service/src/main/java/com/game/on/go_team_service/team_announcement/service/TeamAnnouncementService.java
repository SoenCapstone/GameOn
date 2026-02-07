package com.game.on.go_team_service.team_announcement.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementCreateRequest;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementListResponse;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementResponse;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementUpdateRequest;
import com.game.on.go_team_service.team_announcement.mapper.TeamAnnouncementMapper;
import com.game.on.go_team_service.team_announcement.model.TeamAnnouncement;
import com.game.on.go_team_service.team_announcement.repository.TeamAnnouncementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamAnnouncementService {

    private final TeamAnnouncementRepository announcementRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final CurrentUserProvider currentUserProvider;
    private final TeamAnnouncementMapper teamAnnouncementMapper;

    @Transactional
    public TeamAnnouncementResponse create(UUID teamId, TeamAnnouncementCreateRequest request) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can create announcements");

        TeamAnnouncement announcement = teamAnnouncementMapper.toTeamAnnouncement(teamId, request, userId);

        TeamAnnouncement saved = announcementRepository.save(announcement);
        return teamAnnouncementMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TeamAnnouncementListResponse list(UUID teamId, int page, int size) {
        String userId = currentUserProvider.clerkUserId();
        requireActiveMembership(teamId, userId);

        int safePage = Math.max(page, 0);
        int effectiveSize = (size <= 0) ? 20 : Math.min(size, 50);

        var pageable = PageRequest.of(
                safePage,
                effectiveSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        var pageResult = announcementRepository.findByTeamId(teamId, pageable);

        var announcements = pageResult.stream()
                .map(teamAnnouncementMapper::toResponse)
                .toList();

        return new TeamAnnouncementListResponse(
                announcements,
                pageResult.getTotalElements(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public TeamAnnouncementResponse get(UUID teamId, UUID announcementId) {
        String userId = currentUserProvider.clerkUserId();
        requireActiveMembership(teamId, userId);

        TeamAnnouncement announcement = requireActiveTeamAnnouncement(teamId, announcementId);

        return teamAnnouncementMapper.toResponse(announcement);
    }


    @Transactional
    public TeamAnnouncementResponse update(UUID teamId, UUID announcementId, TeamAnnouncementUpdateRequest request) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can update announcements");

        TeamAnnouncement announcement = requireActiveTeamAnnouncement(teamId, announcementId);

        announcement.setTitle(request.title());
        announcement.setContent(request.content());

        TeamAnnouncement saved = announcementRepository.save(announcement);
        return teamAnnouncementMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID teamId, UUID announcementId) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can delete announcements");

        TeamAnnouncement announcement = requireActiveTeamAnnouncement(teamId, announcementId);

        announcementRepository.delete(announcement);
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

    private TeamAnnouncement requireActiveTeamAnnouncement(UUID teamId, UUID announcementId) {
        return announcementRepository.findByIdAndTeamId(announcementId, teamId)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
    }
}
