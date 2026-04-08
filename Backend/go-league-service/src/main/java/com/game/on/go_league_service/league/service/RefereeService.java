package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.client.dto.TeamMatchDetailResponse;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ConflictException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueMatchResponse;
import com.game.on.go_league_service.league.dto.RefInviteRequest;
import com.game.on.go_league_service.league.dto.RefInviteResponse;
import com.game.on.go_league_service.league.dto.RefereeProfileResponse;
import com.game.on.go_league_service.league.dto.RefereeRegisterRequest;
import com.game.on.go_league_service.league.model.LeagueMatch;
import com.game.on.go_league_service.league.model.LeagueMatchScore;
import com.game.on.go_league_service.league.model.RefInvite;
import com.game.on.go_league_service.league.model.RefInviteStatus;
import com.game.on.go_league_service.league.model.RefereeProfile;
import com.game.on.go_league_service.league.repository.LeagueMatchScoreRepository;
import com.game.on.go_league_service.league.repository.VenueRepository;
import com.game.on.go_league_service.league.repository.LeagueMatchRepository;
import com.game.on.go_league_service.league.repository.RefInviteRepository;
import com.game.on.go_league_service.league.repository.RefereeProfileRepository;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefereeService {

    private final RefereeProfileRepository refereeProfileRepository;
    private final RefInviteRepository refInviteRepository;
    private final LeagueMatchRepository leagueMatchRepository;
    private final LeagueMatchScoreRepository leagueMatchScoreRepository;
    private final VenueRepository venueRepository;
    private final TeamClient teamClient;
    private final CurrentUserProvider userProvider;

    @Transactional
    public RefereeProfileResponse register(RefereeRegisterRequest request) {
        String userId = userProvider.clerkUserId();

        RefereeProfile profile = refereeProfileRepository.findById(userId)
                .orElseGet(() -> RefereeProfile.builder().userId(userId).build());

        if (request.sports() != null) {
            profile.setSports(normalizeList(request.sports()));
        } else if (profile.getSports() == null) {
            profile.setSports(new ArrayList<>());
        }

        if (request.allowedRegions() != null) {
            profile.setAllowedRegions(normalizeList(request.allowedRegions()));
        } else if (profile.getAllowedRegions() == null) {
            profile.setAllowedRegions(new ArrayList<>());
        }

        if (request.isActive() != null) {
            profile.setActive(request.isActive());
        }

        var saved = refereeProfileRepository.save(profile);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RefereeProfileResponse> search(String sport, String region, Boolean active, UUID matchId) {
        List<RefereeProfile> profiles = (active == null)
                ? refereeProfileRepository.findAll()
                : refereeProfileRepository.findByIsActive(active);

        String sportFilter = trimToNull(sport);
        String regionFilter = trimToNull(region);

        if (sportFilter != null) {
            profiles = profiles.stream()
                    .filter(profile -> containsIgnoreCase(profile.getSports(), sportFilter))
                    .toList();
        }
        if (regionFilter != null) {
            profiles = profiles.stream()
                    .filter(profile -> containsIgnoreCase(profile.getAllowedRegions(), regionFilter))
                    .toList();
        }

        if (matchId != null) {
            MatchContext matchContext = resolveMatchContext(matchId);
            String matchSport = matchContext.sport();
            String matchRegion = matchContext.matchRegion();

            profiles = profiles.stream()
                    .filter(profile -> containsIgnoreCase(profile.getSports(), matchSport))
                    .filter(profile -> matchRegion == null || containsIgnoreCase(profile.getAllowedRegions(), matchRegion))
                    .filter(profile -> !isRefereeInTeams(profile.getUserId(), matchContext.homeTeamId(), matchContext.awayTeamId()))
                    .toList();

            if (matchRegion == null) {
                var homeTeam = teamClient.getTeam(matchContext.homeTeamId());
                var awayTeam = teamClient.getTeam(matchContext.awayTeamId());
                profiles = profiles.stream()
                        .filter(profile -> hasRegionOverlap(profile, homeTeam.allowedRegions(), awayTeam.allowedRegions()))
                        .toList();
            }
        }

        return profiles.stream().map(this::toResponse).toList();
    }

    @Transactional
    public RefInviteResponse createRefInvite(UUID matchId, RefInviteRequest request) {
        String userId = userProvider.clerkUserId();

        if (leagueMatchRepository.findById(matchId).isPresent()) {
            throw new BadRequestException("League matches use direct referee assignment");
        }

        var teamMatch = fetchTeamMatch(matchId);

        if (!userId.equals(teamMatch.createdByUserId())) {
            throw new ForbiddenException("Only the match creator can invite a referee");
        }

        var referee = refereeProfileRepository.findById(request.refereeUserId())
                .orElseThrow(() -> new NotFoundException("Referee not found"));

        if (!referee.isActive()) {
            throw new BadRequestException("Referee profile is inactive");
        }

        ensureRefereeEligibleForTeamMatch(referee, teamMatch);

        refInviteRepository.findByMatchIdAndRefereeUserIdAndStatus(matchId, request.refereeUserId(), RefInviteStatus.PENDING)
                .ifPresent(invite -> {
                    throw new ConflictException("An active invite already exists for this referee");
                });

        RefInvite invite = RefInvite.builder()
                .matchId(matchId)
                .refereeUserId(request.refereeUserId())
                .invitedByUserId(userId)
                .status(RefInviteStatus.PENDING)
                .build();

        var saved = refInviteRepository.save(invite);
        log.info("ref_invite_created matchId={} refereeUserId={} byUser={}", matchId, request.refereeUserId(), userId);
        return toResponse(saved);
    }

    @Transactional
    public RefInviteResponse acceptRefInvite(UUID matchId) {
        String userId = userProvider.clerkUserId();

        if (leagueMatchRepository.findById(matchId).isPresent()) {
            throw new BadRequestException("League matches use direct referee assignment");
        }

        var invite = refInviteRepository.findByMatchIdAndRefereeUserIdAndStatus(matchId, userId, RefInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        teamClient.assignReferee(matchId);

        invite.setStatus(RefInviteStatus.ACCEPTED);
        invite.setRespondedAt(OffsetDateTime.now());
        var saved = refInviteRepository.save(invite);
        return toResponse(saved);
    }

    @Transactional
    public RefInviteResponse declineRefInvite(UUID matchId) {
        String userId = userProvider.clerkUserId();

        if (leagueMatchRepository.findById(matchId).isPresent()) {
            throw new BadRequestException("League matches use direct referee assignment");
        }

        var invite = refInviteRepository.findByMatchIdAndRefereeUserIdAndStatus(matchId, userId, RefInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        invite.setStatus(RefInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        var saved = refInviteRepository.save(invite);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RefInviteResponse> listMyPendingRefInvites() {
        String userId = userProvider.clerkUserId();

        return refInviteRepository
                .findByRefereeUserIdAndStatusOrderByCreatedAtDesc(userId, RefInviteStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private MatchContext resolveMatchContext(UUID matchId) {
        var leagueMatch = leagueMatchRepository.findById(matchId).orElse(null);
        if (leagueMatch != null) {
            return new MatchContext(
                    leagueMatch.getHomeTeamId(),
                    leagueMatch.getAwayTeamId(),
                    leagueMatch.getSport(),
                    resolveLeagueMatchRegion(leagueMatch.getVenueId(), leagueMatch.getMatchLocation())
            );
        }

        var teamMatch = fetchTeamMatch(matchId);
        return new MatchContext(
                teamMatch.homeTeamId(),
                teamMatch.awayTeamId(),
                teamMatch.sport(),
                resolveTeamMatchRegion(teamMatch.venueId(), teamMatch.matchLocation())
        );
    }

    private TeamMatchDetailResponse fetchTeamMatch(UUID matchId) {
        var teamMatch = teamClient.getTeamMatch(matchId);
        if (teamMatch == null || teamMatch.homeTeamId() == null) {
            throw new NotFoundException("Match not found");
        }
        if ("LEAGUE_MATCH".equalsIgnoreCase(teamMatch.matchType())) {
            throw new BadRequestException("League matches use direct referee assignment");
        }
        return teamMatch;
    }

    private void ensureRefereeEligibleForTeamMatch(RefereeProfile referee, TeamMatchDetailResponse match) {
        if (!containsIgnoreCase(referee.getSports(), match.sport())) {
            throw new BadRequestException("Referee does not support this sport");
        }

        String matchRegion = resolveTeamMatchRegion(match.venueId(), match.matchLocation());
        if (matchRegion != null && !containsIgnoreCase(referee.getAllowedRegions(), matchRegion)) {
            throw new BadRequestException("Referee does not support the match region");
        }

        if (matchRegion == null) {
            var homeTeam = teamClient.getTeam(match.homeTeamId());
            var awayTeam = teamClient.getTeam(match.awayTeamId());
            if (!hasRegionOverlap(referee, homeTeam.allowedRegions(), awayTeam.allowedRegions())) {
                throw new BadRequestException("Referee does not share a region with the teams");
            }
        }

        if (isRefereeInTeams(referee.getUserId(), match.homeTeamId(), match.awayTeamId())) {
            throw new BadRequestException("Referee cannot be a member of either team");
        }
    }

    private boolean isRefereeInTeams(String refereeUserId, UUID homeTeamId, UUID awayTeamId) {
        boolean isMemberHome = Boolean.TRUE.equals(teamClient.isMember(homeTeamId, refereeUserId));
        boolean isMemberAway = Boolean.TRUE.equals(teamClient.isMember(awayTeamId, refereeUserId));
        return isMemberHome || isMemberAway;
    }

    private RefereeProfileResponse toResponse(RefereeProfile profile) {
        List<String> sports = profile.getSports() == null
                ? List.of()
                : new ArrayList<>(profile.getSports());
        List<String> allowedRegions = profile.getAllowedRegions() == null
                ? List.of()
                : new ArrayList<>(profile.getAllowedRegions());

        return new RefereeProfileResponse(
                profile.getUserId(),
                sports,
                allowedRegions,
                profile.isActive(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    private RefInviteResponse toResponse(RefInvite invite) {
        return new RefInviteResponse(
                invite.getId(),
                invite.getMatchId(),
                invite.getRefereeUserId(),
                invite.getInvitedByUserId(),
                invite.getStatus(),
                invite.getCreatedAt(),
                invite.getRespondedAt()
        );
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) {
            return new ArrayList<>();
        }
        return values.stream()
                .map(value -> value == null ? null : value.trim())
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .toList();
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        if (target == null || values == null) {
            return false;
        }
        return values.stream().anyMatch(value -> value != null && value.equalsIgnoreCase(target));
    }

    private boolean hasRegionOverlap(RefereeProfile referee, List<String> homeRegions, List<String> awayRegions) {
        if (referee.getAllowedRegions() == null || referee.getAllowedRegions().isEmpty()) {
            return false;
        }
        return referee.getAllowedRegions().stream()
                .anyMatch(region -> containsIgnoreCase(homeRegions, region) || containsIgnoreCase(awayRegions, region));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String resolveLeagueMatchRegion(UUID venueId, String fallback) {
        if (venueId != null) {
            return venueRepository.findById(venueId)
                    .map(venue -> trimToNull(venue.getRegion()))
                    .orElse(null);
        }
        return trimToNull(fallback);
    }

    private String resolveTeamMatchRegion(UUID venueId, String fallback) {
        if (venueId != null) {
            var venue = teamClient.getVenue(venueId);
            return venue == null ? null : trimToNull(venue.region());
        }
        return trimToNull(fallback);
    }

    private record MatchContext(UUID homeTeamId, UUID awayTeamId, String sport, String matchRegion) {
    }

    public boolean isReferee() {
        String userId = userProvider.clerkUserId();
        return refereeProfileRepository.existsByUserId(userId);
    }

    public boolean isActive() {
        String userId = userProvider.clerkUserId();
        RefereeProfile referee = refereeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Referee not found"));
        return referee.isActive();
    }

    @Transactional
    public RefereeProfileResponse getByUserId() {
        String userId = userProvider.clerkUserId();
        RefereeProfile referee = refereeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Referee not found"));
        Hibernate.initialize(referee.getSports());
        Hibernate.initialize(referee.getAllowedRegions());

        List<String> sports = referee.getSports();

        List<String> allowedRegions = referee.getAllowedRegions();
        return new RefereeProfileResponse(
                referee.getUserId(),
                sports,
                allowedRegions,
                referee.isActive(),
                referee.getCreatedAt(),
                referee.getUpdatedAt()
        );
    }

    public void updateSports(List<String> sports) {
        String userId = userProvider.clerkUserId();

        RefereeProfile referee = refereeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Referee not found"));
        if (sports != null) {
            referee.setSports(normalizeList(sports));
            refereeProfileRepository.save(referee);
        }
    }

    public void updateRegions(List<String> regions){
        String userId = userProvider.clerkUserId();

        var referee = refereeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Referee not found"));
        if (regions != null) {
            referee.setAllowedRegions(normalizeList(regions));
            refereeProfileRepository.save(referee);
        }
    }

    public void updateStatus(boolean isActive) {
        String userId = userProvider.clerkUserId();
        var referee = refereeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException("Referee not found"));


        referee.setActive(isActive);

        refereeProfileRepository.save(referee);
    }

    @Transactional(readOnly = true)
    public List<LeagueMatchResponse> listMyLeagueMatches() {
        String userId = userProvider.clerkUserId();
        List<LeagueMatch> matches = leagueMatchRepository.findByRefereeUserIdOrderByStartTimeDesc(userId);
        if (matches.isEmpty()) {
            return List.of();
        }

        Map<UUID, LeagueMatchScore> scoresByMatchId = leagueMatchScoreRepository
                .findByMatch_IdIn(matches.stream().map(LeagueMatch::getId).toList())
                .stream()
                .collect(Collectors.toMap(s -> s.getMatch().getId(), Function.identity()));

        return matches.stream()
                .map(m -> toMatchResponse(m, scoresByMatchId.get(m.getId())))
                .toList();
    }

    private LeagueMatchResponse toMatchResponse(LeagueMatch match, LeagueMatchScore score) {
        return new LeagueMatchResponse(
                match.getId(),
                match.getLeague().getId(),
                match.getStatus(),
                match.getHomeTeamId(),
                match.getAwayTeamId(),
                score == null ? null : score.getHomeScore(),
                score == null ? null : score.getAwayScore(),
                match.getSport(),
                match.getStartTime(),
                match.getEndTime(),
                match.getScheduledDate(),
                match.getMatchLocation(),
                match.getVenueId(),
                match.isRequiresReferee(),
                match.getRefereeUserId(),
                match.getCreatedByUserId(),
                match.getCancelledByUserId(),
                match.getCancelReason(),
                match.getCancelledAt(),
                match.getCreatedAt(),
                match.getUpdatedAt()
        );
    }
}
