package com.game.on.go_team_service.team_post.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamMemberStatus;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team_post.dto.TeamPostCreateRequest;
import com.game.on.go_team_service.team_post.dto.TeamPostListResponse;
import com.game.on.go_team_service.team_post.dto.TeamPostResponse;
import com.game.on.go_team_service.team_post.dto.TeamPostUpdateRequest;
import com.game.on.go_team_service.team_post.mapper.TeamPostMapper;
import com.game.on.go_team_service.team_post.model.TeamPost;
import com.game.on.go_team_service.team_post.model.TeamPostScope;
import com.game.on.go_team_service.team_post.repository.TeamPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.game.on.go_team_service.client.UserClient;


import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamPostService {

    private final TeamPostRepository postRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final CurrentUserProvider currentUserProvider;
    private final TeamPostMapper teamPostMapper;

    @Transactional
    public TeamPostResponse create(UUID teamId, TeamPostCreateRequest request) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can create posts");

        String authorRole = membership.getRole().name();

        TeamPost post = teamPostMapper.toTeamPost(teamId, request, userId, authorRole);

        TeamPost saved = postRepository.save(post);
        return teamPostMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TeamPostListResponse list(UUID teamId, int page, int size) {
        String userId = currentUserProvider.clerkUserId();
        boolean isMember = isActiveMember(teamId, userId);

        int safePage = Math.max(page, 0);
        int effectiveSize = (size <= 0) ? 20 : Math.min(size, 50);

        var pageable = PageRequest.of(
                safePage,
                effectiveSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        var pageResult = isMember
                ? postRepository.findByTeamId(teamId, pageable)
                : postRepository.findByTeamIdAndScope(teamId, TeamPostScope.EVERYONE, pageable);

        var posts = pageResult.stream()
                .map(teamPostMapper::toResponse)
                .toList();

        return new TeamPostListResponse(
                posts,
                pageResult.getTotalElements(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public TeamPostResponse get(UUID teamId, UUID postId) {
        String userId = currentUserProvider.clerkUserId();
        boolean isMember = isActiveMember(teamId, userId);

        TeamPost post = requireActiveTeamPost(teamId, postId);

        if (post.getScope() == TeamPostScope.MEMBERS && !isMember) {
            throw new ForbiddenException("You are not allowed to view this post");
        }

        return teamPostMapper.toResponse(post);
    }


    @Transactional
    public TeamPostResponse update(UUID teamId, UUID postId, TeamPostUpdateRequest request) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can update posts");

        TeamPost post = requireActiveTeamPost(teamId, postId);

        post.setTitle(request.title());
        post.setBody(request.body());
        post.setScope(request.scope());

        TeamPost saved = postRepository.save(post);
        return teamPostMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID teamId, UUID postId) {
        String userId = currentUserProvider.clerkUserId();
        TeamMember membership = requireActiveMembership(teamId, userId);

        ensureRole(membership, Set.of(TeamRole.OWNER, TeamRole.COACH, TeamRole.MANAGER),
                "Only team owners, coaches, or managers can delete posts");

        TeamPost post = requireActiveTeamPost(teamId, postId);

        postRepository.delete(post);
    }

    private boolean isActiveMember(UUID teamId, String userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .filter(member -> member.getStatus() == TeamMemberStatus.ACTIVE)
                .isPresent();
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

    private TeamPost requireActiveTeamPost(UUID teamId, UUID postId) {
        return postRepository.findByIdAndTeamId(postId, teamId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }
}
