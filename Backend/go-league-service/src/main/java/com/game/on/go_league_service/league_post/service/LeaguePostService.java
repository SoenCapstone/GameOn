package com.game.on.go_league_service.league_post.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.service.LeagueService;
import com.game.on.go_league_service.league_post.dto.*;
import com.game.on.go_league_service.league_post.mapper.LeaguePostMapper;
import com.game.on.go_league_service.league_post.model.LeaguePost;
import com.game.on.go_league_service.league_post.model.LeaguePostScope;
import com.game.on.go_league_service.league_post.repository.LeaguePostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaguePostService {

    private final LeaguePostRepository postRepository;
    private final LeagueService leagueService;
    private final LeagueTeamRepository leagueTeamRepository;
    private final CurrentUserProvider userProvider;
    private final LeaguePostMapper mapper;

    @Transactional
    public LeaguePostResponse create(UUID leagueId, LeaguePostCreateRequest request) {
        String userId = userProvider.clerkUserId();
        League league = leagueService.requireActiveLeague(leagueId);

        ensureOwner(league, userId);

        LeaguePost post = mapper.toLeaguePost(leagueId, request, userId);

        LeaguePost saved = postRepository.save(post);
        return mapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LeaguePostListResponse list(UUID leagueId, int page, int size) {
        String userId = userProvider.clerkUserId();
        League league = leagueService.requireActiveLeague(leagueId);

        int safePage = Math.max(page, 0);
        int effectiveSize = (size <= 0) ? 20 : Math.min(size, 50);

        var pageable = PageRequest.of(safePage, effectiveSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        boolean canViewMembers = canViewMembersScope(league, userId);

        var pageResult = canViewMembers
                ? postRepository.findByLeagueId(leagueId, pageable)
                : postRepository.findByLeagueIdAndScope(leagueId, LeaguePostScope.EVERYONE, pageable);

        var items = pageResult.stream().map(mapper::toResponse).toList();

        return new LeaguePostListResponse(
                items,
                pageResult.getTotalElements(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public LeaguePostResponse get(UUID leagueId, UUID postId) {
        String userId = userProvider.clerkUserId();
        League league = leagueService.requireActiveLeague(leagueId);

        LeaguePost post = requireActiveLeaguePost(leagueId, postId);

        if (post.getScope() == LeaguePostScope.MEMBERS && !canViewMembersScope(league, userId)) {
            throw new ForbiddenException("You are not allowed to view this post");
        }

        return mapper.toResponse(post);
    }

    @Transactional
    public LeaguePostResponse update(UUID leagueId, UUID postId, LeaguePostUpdateRequest request) {
        String userId = userProvider.clerkUserId();
        League league = leagueService.requireActiveLeague(leagueId);

        ensureOwner(league, userId);

        LeaguePost post = requireActiveLeaguePost(leagueId, postId);

        post.setTitle(request.title() == null ? null : request.title().trim());
        post.setBody(request.body().trim());
        post.setScope(request.scope());

        LeaguePost saved = postRepository.save(post);
        return mapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID leagueId, UUID postId) {
        String userId = userProvider.clerkUserId();
        League league = leagueService.requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        LeaguePost post = requireActiveLeaguePost(leagueId, postId);

        postRepository.delete(post);
    }

    private void ensureOwner(League league, String userId) {
        if (!league.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the owner can perform this action");
        }
    }

    private boolean canViewMembersScope(League league, String userId) {
        if (league.getOwnerUserId().equals(userId)) return true;

        List<UUID> myTeamIds = leagueService.fetchTeamIdsForUser();
        if (myTeamIds.isEmpty()) return false;

        return leagueTeamRepository.existsByLeague_IdAndTeamIdIn(league.getId(), myTeamIds);
    }

    private LeaguePost requireActiveLeaguePost(UUID leagueId, UUID postId) {
        return postRepository.findByIdAndLeagueId(postId, leagueId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
    }
}
