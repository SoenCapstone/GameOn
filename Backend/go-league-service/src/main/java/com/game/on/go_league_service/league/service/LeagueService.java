package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueDetailResponse;
import com.game.on.go_league_service.league.dto.LeagueInviteCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueListResponse;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueSeasonResponse;
import com.game.on.go_league_service.league.dto.LeagueSummaryResponse;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.dto.LeagueInviteRespondRequest;
import com.game.on.go_league_service.league.mapper.LeagueMapper;
import com.game.on.go_league_service.league.metrics.LeagueMetricsPublisher;
import com.game.on.go_league_service.league.model.*;
import com.game.on.go_league_service.league.repository.LeagueMemberRepository;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository.LeagueSeasonCountProjection;
import com.game.on.go_league_service.league.repository.LeagueInviteRepository;
import com.game.on.go_league_service.league.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.game.on.go_league_service.league.service.LeagueSpecifications.*;
import static java.lang.String.format;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeagueService {

    private final LeagueRepository leagueRepository;
    private final LeagueSeasonRepository leagueSeasonRepository;
    private final LeagueMapper leagueMapper;
    private final CurrentUserProvider userProvider;
    private final LeagueMetricsPublisher metricsPublisher;
    private final LeagueInviteRepository leagueInviteRepository;
    private final LeagueMemberRepository leagueMemberRepository;




    @Transactional
    public LeagueDetailResponse createLeague(LeagueCreateRequest request) {
        String ownerUserId = userProvider.clerkUserId();

        League league = leagueMapper.toLeague(request, ownerUserId);

        var saved = leagueRepository.save(league);

        LeagueMember ownerMember = LeagueMember.builder()
                .leagueId(saved.getId())
                .userId(ownerUserId)
                .role(LeagueRole.OWNER)
                .joinedAt(OffsetDateTime.now())
                .build();
        leagueMemberRepository.save(ownerMember);

        metricsPublisher.leagueCreated();
        log.info("league_created leagueId={} ownerId={}", saved.getId(), ownerUserId);
        metricsPublisher.leagueCreated();

        return leagueMapper.toDetail(saved, 0);
    }

    @Transactional
    public LeagueDetailResponse updateLeague(UUID leagueId, LeagueUpdateRequest request) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        if (isNoop(request)) {
            throw new BadRequestException("At least one field must be provided for update");
        }

        if (StringUtils.hasText(request.name())) {
            league.setName(request.name().trim());
        }
        if (StringUtils.hasText(request.sport())) {
            league.setSport(request.sport().trim());
        }
        if (request.region() != null) {
            league.setRegion(trimToNull(request.region()));
        }
        if (request.location() != null) {
            league.setLocation(trimToNull(request.location()));
        }
        if (request.level() != null) {
            league.setLevel(request.level());
        }
        if (request.privacy() != null) {
            league.setPrivacy(request.privacy());
        }

        var saved = leagueRepository.save(league);
        metricsPublisher.leagueUpdated();
        log.info("league_updated leagueId={} byUser={}", leagueId, userId);
        var seasonCount = leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(leagueId);
        return leagueMapper.toDetail(saved, seasonCount);
    }

    @Transactional
    public void archiveLeague(UUID leagueId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);
        league.setArchivedAt(OffsetDateTime.now());
        leagueRepository.save(league);
        metricsPublisher.leagueArchived();
        log.info("League {} archived by user {}", leagueId, userId);
    }

    @Transactional
    public void createInvite(UUID leagueId, LeagueInviteCreateRequest request, Long callerId) {
        var league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
        ensureOwner(league, callerId);

        String email = request.inviteeEmail().toLowerCase();

        leagueInviteRepository.findByLeagueIdAndInviteeEmail(
                leagueId,
                request.inviteeEmail()
        ).ifPresent(invite -> {
            throw new BadRequestException("User already invited to this league");
        });
        LeagueRole callerRole = leagueMemberRepository
                .findRoleByLeagueIdAndUserId(leagueId, callerId)
                .orElseThrow(() -> new ForbiddenException("Not a member of this league"));

        if (callerRole != LeagueRole.OWNER && callerRole != LeagueRole.ADMIN) {
            throw new ForbiddenException("Only OWNER or ADMIN can invite users");
        }

        String inviteeEmail = request.inviteeEmail();

        var invite = LeagueInvite.builder()
                .leagueId(leagueId)
                .inviteeEmail(inviteeEmail)
                .role(request.role())
                .invitedByUserId(callerId)
                .status(LeagueInviteStatus.PENDING)
                .createdAt(OffsetDateTime.now())
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();

        leagueInviteRepository.save(invite);
    }


    @Transactional
    public void respondToInvite(UUID inviteId, Long callerId, LeagueInviteRespondRequest request) {
        LeagueInvite invite = leagueInviteRepository.findById(inviteId)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        if (invite.getExpiresAt() != null && invite.getExpiresAt().isBefore(OffsetDateTime.now())) {
            invite.setStatus(LeagueInviteStatus.EXPIRED);
            return;
        }

        if (invite.getStatus() != LeagueInviteStatus.PENDING) {
            throw new BadRequestException("Invite already responded to");
        }

        if (request.status() == LeagueInviteStatus.ACCEPTED) {
            LeagueMember member = LeagueMember.builder()
                    .leagueId(invite.getLeagueId())
                    .userId(callerId)
                    .role(invite.getRole())
                    .joinedAt(OffsetDateTime.now())
                    .build();

            leagueMemberRepository.save(member);
        }

        invite.setStatus(request.status());
        invite.setUpdatedAt(OffsetDateTime.now());
    }


    @Transactional(readOnly = true)
    public LeagueDetailResponse getLeague(UUID leagueId) {
        String callerId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureCanView(league, callerId);
        var seasonCount = leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(leagueId);
        return leagueMapper.toDetail(league, seasonCount);
    }

    @Transactional(readOnly = true)
    public LeagueDetailResponse getLeagueBySlug(String slug) {
        String callerId = userProvider.clerkUserId();
        var league = leagueRepository.findBySlugIgnoreCaseAndArchivedAtIsNull(slug)
                .orElseThrow(() -> new NotFoundException("League not found"));
        ensureCanView(league, callerId);
        var seasonCount = leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(league.getId());
        return leagueMapper.toDetail(league, seasonCount);
    }

    @Transactional(readOnly = true)
    public LeagueListResponse listLeagues(LeagueSearchCriteria criteria, int page, int size) {
        String userId = userProvider.clerkUserId();

        int safePage = Math.max(page, 0);
        int effectiveSize = size <= 0 ? 20 : Math.min(size, 50);
        Pageable pageable = PageRequest.of(
                safePage,
                effectiveSize,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<League> spec = null;
        spec = and(spec, notArchived());
        spec = and(spec, withSport(trimToNull(criteria.sport())));
        spec = and(spec, withRegion(trimToNull(criteria.region())));
        spec = and(spec, search(trimToNull(criteria.query())));

        if (criteria.onlyMine()) {
            spec = and(spec, ownerIs(userId));
        } else {
            spec = and(spec, visibleTo(userId));
        }

        var pageResult = leagueRepository.findAll(spec, pageable);
        var leagueIds = pageResult.stream().map(League::getId).toList();
        var seasonCounts = fetchSeasonCounts(leagueIds);

        var summaries = pageResult.stream()
                .map(league -> leagueMapper.toSummary(league,
                        seasonCounts.getOrDefault(league.getId(), defaultSeasonCount(league))))
                .toList();

        metricsPublisher.leagueListQuery();
        log.info("league_list_query userId={} total={} page={} size={} filters={{my={},sport={},region={},q={}}}",
                userId, pageResult.getTotalElements(), pageResult.getNumber(), pageResult.getSize(),
                criteria.onlyMine(), criteria.sport(), criteria.region(), criteria.query());

        return new LeagueListResponse(
                summaries,
                pageResult.getTotalElements(),
                pageResult.getNumber(),
                pageResult.getSize(),
                pageResult.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public List<LeagueSeasonResponse> listSeasons(UUID leagueId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureCanView(league, userId);
        return leagueSeasonRepository.findByLeague_IdAndArchivedAtIsNullOrderByStartDateAscNameAsc(leagueId)
                .stream()
                .map(leagueMapper::toSeason)
                .toList();
    }

    private League requireActiveLeague(UUID leagueId) {
        return leagueRepository.findByIdAndArchivedAtIsNull(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
    }

    private void ensureOwner(League league, String callerId) {
        if (!league.getOwnerUserId().equals(callerId)) {
            throw new ForbiddenException("Only the owner can perform this action");
        }
    }

    private void ensureCanView(League league, String callerId) {
        if (league.getPrivacy() == LeaguePrivacy.PRIVATE
                && !league.getOwnerUserId().equals(callerId)) {
            throw new NotFoundException("League not found");
        }
    }

    private Map<UUID, Long> fetchSeasonCounts(Collection<UUID> leagueIds) {
        if (leagueIds.isEmpty()) {
            return Map.of();
        }
        return leagueSeasonRepository.countActiveSeasonsByLeagueIds(leagueIds).stream()
                .collect(Collectors.toMap(LeagueSeasonCountProjection::getLeagueId, LeagueSeasonCountProjection::getCount));
    }

    private String generateUniqueSlug(String name) {
        var baseSlug = SlugGenerator.from(name);
        if (!StringUtils.hasText(baseSlug)) {
            throw new BadRequestException("Unable to generate league slug");
        }
        var slug = baseSlug;
        int suffix = 1;
        while (leagueRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + suffix++;
        }
        return slug;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean isNoop(LeagueUpdateRequest request) {
        return request.name() == null && request.sport() == null && request.region() == null
                && request.location() == null && request.level() == null && request.privacy() == null;
    }

    private long defaultSeasonCount(League league) {
        return league.getSeasonCount() == null ? 0 : league.getSeasonCount();
    }

    private static <T> Specification<T> and(Specification<T> base, Specification<T> next) {
        if (next == null) return base;
        if (base == null) return next;
        return base.and(next);
    }

    public List<LeagueInviteRespondRequest> getInvitesByLeagueId(UUID leagueId) {
        return leagueInviteRepository.findByLeagueId(leagueId)
                .stream()
                .map(leagueMapper::toResponse)
                .toList();
    }

    public LeagueInviteRespondRequest getInviteById(UUID inviteId) {
        LeagueInvite invite = leagueInviteRepository.findByInviteId(inviteId)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        return leagueMapper.toResponse(invite);
    }
    public List<LeagueInviteRespondRequest> getInvitesByEmail(String email) {
        var invites = leagueInviteRepository.findByInviteeEmail(email);
        return invites.stream()
                .map(leagueMapper::toResponse)
                .toList();
    }


    public List<LeagueMember> getMembersByLeague(UUID leagueId) {
        return leagueMemberRepository.findByLeagueId(leagueId);
    }


    public List<LeagueMember> getMembershipsByUser(Long userId) {
        return leagueMemberRepository.findByUserId(userId);
    }


    public LeagueMember getMembership(UUID leagueId, Long userId) {
        return leagueMemberRepository
                .findByLeagueIdAndUserId(leagueId, userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "User is not a member of this league"
                        )
                );
    }



}
