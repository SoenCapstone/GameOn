package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.client.dto.TeamListItem;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.*;
import com.game.on.go_league_service.league.mapper.LeagueMapper;
import com.game.on.go_league_service.league.metrics.LeagueMetricsPublisher;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.model.LeagueSeason;
import com.game.on.go_league_service.league.mapper.LeagueTeamMapper;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository.LeagueSeasonCountProjection;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final LeagueTeamRepository leagueTeamRepository;
    private final LeagueTeamMapper leagueTeamMapper;
    private final TeamClient teamClient;
    private final CurrentUserProvider userProvider;
    private final LeagueMetricsPublisher metricsPublisher;

    @Transactional
    public LeagueDetailResponse createLeague(LeagueCreateRequest request) {
        String ownerUserId = userProvider.clerkUserId();

        League league = leagueMapper.toLeague(request, ownerUserId);

        var saved = leagueRepository.save(league);
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
        if (request.logoUrl() != null) {
            league.setLogoUrl(trimToNull(request.logoUrl()));
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
            var teamIds = fetchTeamIdsForUser();
            var leagueIds = teamIds.isEmpty()
                    ? List.<UUID>of()
                    : leagueTeamRepository.findLeagueIdsByTeamIdIn(teamIds);
            var mineSpec = ownerIs(userId).or(idIn(leagueIds));
            spec = and(spec, mineSpec);
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

    @Transactional(readOnly = true)
    public List<LeagueTeamResponse> listLeagueTeams(UUID leagueId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureCanView(league, userId);
        return leagueTeamRepository.findByLeague_IdOrderByCreatedAtDesc(leagueId).stream()
                .map(leagueTeamMapper::toResponse)
                .toList();
    }

    @Transactional
    public void removeTeamFromLeague(UUID leagueId, UUID teamId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        var leagueTeam = leagueTeamRepository.findByLeague_IdAndTeamId(leagueId, teamId)
                .orElseThrow(() -> new NotFoundException("Team is not part of this league"));
        leagueTeamRepository.delete(leagueTeam);
        log.info("league_team_removed leagueId={} teamId={} byUser={}", leagueId, teamId, userId);
    }

    @Transactional
    public LeagueSeasonResponse createSeason(UUID leagueId, LeagueSeasonCreateRequest request) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        validateSeasonDates(request.getStartDate(), request.getEndDate());
        validateNoSeasonOverlap(leagueId, request.getStartDate(), request.getEndDate());

        LeagueSeason season = leagueMapper.toSeason(request, league);

        var saved = leagueSeasonRepository.save(season);

        updateSeasonCount(league);

        log.info("league_season_created leagueId={} seasonId={} byUser={}",
                leagueId, saved.getId(), userId);

        return leagueMapper.toSeason(saved);
    }

    @Transactional(readOnly = true)
    public LeagueSeasonResponse getSeason(UUID leagueId, UUID seasonId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureCanView(league, userId);

        var season = leagueSeasonRepository
                .findByIdAndLeague_IdAndArchivedAtIsNull(seasonId, leagueId)
                .orElseThrow(() -> new NotFoundException("Season not found"));
        return leagueMapper.toSeason(season);
    }

    @Transactional
    public LeagueSeasonResponse updateSeason(UUID leagueId,
                                             UUID seasonId,
                                             LeagueSeasonUpdateRequest request) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        var season = leagueSeasonRepository
                .findByIdAndLeague_IdAndArchivedAtIsNull(seasonId, leagueId)
                .orElseThrow(() -> new NotFoundException("Season not found"));

        if (isNoop(request)) {
            throw new BadRequestException("At least one field must be provided for update");
        }

        // Determine effective dates for validation
        var effectiveStartDate = request.getStartDate() != null ? request.getStartDate() : season.getStartDate();
        var effectiveEndDate = request.getEndDate() != null ? request.getEndDate() : season.getEndDate();
        
        validateSeasonDates(effectiveStartDate, effectiveEndDate);
        validateNoSeasonOverlapOnUpdate(leagueId, seasonId, effectiveStartDate, effectiveEndDate);

        if (request.getName() != null) {
            season.setName(request.getName().trim());
        }
        if (request.getStartDate() != null) {
            season.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            season.setEndDate(request.getEndDate());
        }

        var saved = leagueSeasonRepository.save(season);

        log.info("league_season_updated leagueId={} seasonId={} byUser={}",
                leagueId, seasonId, userId);

        return leagueMapper.toSeason(saved);
    }

    @Transactional
    public void archiveSeason(UUID leagueId, UUID seasonId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        var season = leagueSeasonRepository
                .findByIdAndLeague_IdAndArchivedAtIsNull(seasonId, leagueId)
                .orElseThrow(() -> new NotFoundException("Season not found"));

        season.setArchivedAt(OffsetDateTime.now());
        leagueSeasonRepository.save(season);

        updateSeasonCount(league);

        log.info("league_season_archived leagueId={} seasonId={} byUser={}",
                leagueId, seasonId, userId);
        // metricsPublisher.seasonArchived(); // optional
    }

    public List<LeagueTeamResponse> getMyLeagueMemberships(UUID leagueId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureCanView(league, userId);

        var teamIds = fetchTeamIdsForUser();
        if (teamIds.isEmpty()) {
            return List.of();
        }

        return teamIds.stream().map(id ->
                        leagueTeamRepository.findByLeague_IdAndTeamId(leagueId, id)
                                .map(leagueTeamMapper::toResponse).orElse(null)
                ).filter(Objects::nonNull).toList();
    }

    @Transactional
    public LeagueSeasonResponse restoreSeason(UUID leagueId, UUID seasonId) {
        String userId = userProvider.clerkUserId();
        var league = requireActiveLeague(leagueId);
        ensureOwner(league, userId);

        var season = leagueSeasonRepository
                .findByIdAndLeague_IdAndArchivedAtIsNotNull(seasonId, leagueId)
                .orElseThrow(() -> new NotFoundException("Season not found"));

        season.setArchivedAt(null);
        var saved = leagueSeasonRepository.save(season);

        updateSeasonCount(league);

        log.info("league_season_restored leagueId={} seasonId={} byUser={}",
                leagueId, seasonId, userId);

        return leagueMapper.toSeason(saved);
    }

    public League requireActiveLeague(UUID leagueId) {
        return leagueRepository.findByIdAndArchivedAtIsNull(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
    }

    private void ensureOwner(League league, String callerId) {
        if (!league.getOwnerUserId().equals(callerId)) {
            throw new ForbiddenException("Only the owner can perform this action");
        }
    }

    public void ensureCanView(League league, String callerId) {
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

    @Transactional
    public void updateLeaugeLogo(UUID leagueId, String logoUrl) {
        var team = requireActiveLeague(leagueId);
        team.setLogoUrl(logoUrl);
        leagueRepository.save(team);
        log.info("League logo updated for league ID {}", leagueId);
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

    private boolean isNoop(LeagueSeasonUpdateRequest request) {
        return request.getName() == null
                && request.getStartDate() == null
                && request.getEndDate() == null;
    }

    private long defaultSeasonCount(League league) {
        return league.getSeasonCount() == null ? 0 : league.getSeasonCount();
    }

    private static <T> Specification<T> and(Specification<T> base, Specification<T> next) {
        if (next == null) return base;
        if (base == null) return next;
        return base.and(next);
    }

    private void updateSeasonCount(League league) {
        long count = leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(league.getId());
        league.setSeasonCount((int) count);
        leagueRepository.save(league);
    }

    private void validateSeasonDates(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            throw new BadRequestException("Both start date and end date are required");
        }
        
        if (startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date must be before or equal to end date");
        }
    }

    private void validateNoSeasonOverlap(UUID leagueId, LocalDate startDate, LocalDate endDate) {
        var overlappingSeasons = leagueSeasonRepository
                .findByLeague_IdAndArchivedAtIsNullAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        leagueId, endDate, startDate);
        
        if (!overlappingSeasons.isEmpty()) {
            throw new BadRequestException("This season overlaps with an existing season");
        }
    }

    private void validateNoSeasonOverlapOnUpdate(UUID leagueId, UUID seasonId, LocalDate startDate, LocalDate endDate) {
        var overlappingSeasons = leagueSeasonRepository
                .findByLeague_IdAndArchivedAtIsNullAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        leagueId, endDate, startDate);
        
        overlappingSeasons = overlappingSeasons.stream()
                .filter(s -> !s.getId().equals(seasonId))
                .toList();
        
        if (!overlappingSeasons.isEmpty()) {
            throw new BadRequestException("This season overlaps with an existing season");
        }
    }

    public List<UUID> fetchTeamIdsForUser() {
        try {
            var response = teamClient.listTeams(true);
            if (response == null || response.items() == null) {
                return List.of();
            }
            return response.items().stream()
                    .map(TeamListItem::id)
                    .filter(Objects::nonNull)
                    .toList();
        } catch (Exception ex) {
            log.error("Failed to fetch user teams from team service", ex);
            return List.of();
        }
    }
}
