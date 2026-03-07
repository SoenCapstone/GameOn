package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ConflictException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.AssignRefereeRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchCancelRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchResponse;
import com.game.on.go_league_service.league.dto.LeagueMatchScoreRequest;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueMatch;
import com.game.on.go_league_service.league.model.LeagueMatchScore;
import com.game.on.go_league_service.league.model.LeagueMatchStatus;
import com.game.on.go_league_service.league.model.RefereeProfile;
import com.game.on.go_league_service.league.repository.LeagueMatchRepository;
import com.game.on.go_league_service.league.repository.LeagueMatchScoreRepository;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.repository.RefereeProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeagueMatchService {

    private final LeagueRepository leagueRepository;
    private final LeagueTeamRepository leagueTeamRepository;
    private final LeagueMatchRepository leagueMatchRepository;
    private final LeagueMatchScoreRepository leagueMatchScoreRepository;
    private final RefereeProfileRepository refereeProfileRepository;
    private final TeamClient teamClient;
    private final CurrentUserProvider userProvider;

    @Transactional
    public LeagueMatchResponse createMatch(UUID leagueId, LeagueMatchCreateRequest request) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);
        ensureLeagueOwner(league, userId);

        if (Boolean.FALSE.equals(request.requiresReferee())) {
            throw new BadRequestException("League matches require a referee");
        }
        if (request.homeTeamId().equals(request.awayTeamId())) {
            throw new BadRequestException("homeTeamId and awayTeamId must be different");
        }
        if (!leagueTeamRepository.existsByLeague_IdAndTeamId(leagueId, request.homeTeamId())
                || !leagueTeamRepository.existsByLeague_IdAndTeamId(leagueId, request.awayTeamId())) {
            throw new BadRequestException("Both teams must be part of the league");
        }
        validateTimes(request.startTime(), request.endTime());

        var homeTeam = teamClient.getTeam(request.homeTeamId());
        var awayTeam = teamClient.getTeam(request.awayTeamId());

        String matchSport = resolveMatchSport(homeTeam.sport(), awayTeam.sport());

        LeagueMatch match = LeagueMatch.builder()
                .league(league)
                .homeTeamId(request.homeTeamId())
                .awayTeamId(request.awayTeamId())
                .sport(matchSport)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .matchLocation(trimToNull(request.matchLocation()))
                .requiresReferee(true)
                .status(LeagueMatchStatus.CONFIRMED)
                .createdByUserId(userId)
                .build();

        var referee = refereeProfileRepository.findById(request.refereeUserId())
                .orElseThrow(() -> new NotFoundException("Referee not found"));
        if (!referee.isActive()) {
            throw new BadRequestException("Referee profile is inactive");
        }
        ensureRefereeEligible(referee, match);
        match.setRefereeUserId(referee.getUserId());

        var saved = leagueMatchRepository.save(match);
        log.info("league_match_created matchId={} leagueId={} byUser={}", saved.getId(), leagueId, userId);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<LeagueMatchResponse> listMatches(UUID leagueId) {
        requireActiveLeague(leagueId);
        return leagueMatchRepository.findByLeague_IdOrderByStartTimeDesc(leagueId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LeagueMatchResponse cancelMatch(UUID leagueId, UUID matchId, LeagueMatchCancelRequest request) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);
        ensureLeagueOwner(league, userId);

        var match = leagueMatchRepository.findByIdAndLeague_Id(matchId, leagueId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        match.setStatus(LeagueMatchStatus.CANCELLED);
        match.setCancelledAt(OffsetDateTime.now());
        match.setCancelledByUserId(userId);
        match.setCancelReason(trimToNull(request == null ? null : request.reason()));

        return toResponse(leagueMatchRepository.save(match));
    }

    @Transactional
    public void submitScore(UUID leagueId, UUID matchId, LeagueMatchScoreRequest request) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);

        var match = leagueMatchRepository.findByIdAndLeague_Id(matchId, leagueId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        leagueMatchScoreRepository.findByMatch_Id(matchId).ifPresent(score -> {
            throw new ConflictException("Final score already submitted");
        });

        if (StringUtils.hasText(match.getRefereeUserId())) {
            if (!match.getRefereeUserId().equals(userId)) {
                throw new ForbiddenException("Only the referee can submit the score");
            }
        } else if (!league.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the league owner can submit the score when no referee is assigned");
        }

        LeagueMatchScore score = LeagueMatchScore.builder()
                .match(match)
                .homeScore(request.homeScore())
                .awayScore(request.awayScore())
                .submittedByUserId(userId)
                .build();
        leagueMatchScoreRepository.save(score);
    }

    @Transactional
    public LeagueMatchResponse assignReferee(UUID leagueId, UUID matchId, AssignRefereeRequest request) {
        String userId = userProvider.clerkUserId();
        League league = requireActiveLeague(leagueId);
        ensureLeagueOwner(league, userId);

        var match = leagueMatchRepository.findByIdAndLeague_Id(matchId, leagueId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        if (StringUtils.hasText(match.getRefereeUserId())) {
            throw new ConflictException("Referee already assigned");
        }

        var referee = refereeProfileRepository.findById(request.refereeUserId())
                .orElseThrow(() -> new NotFoundException("Referee not found"));

        if (!referee.isActive()) {
            throw new BadRequestException("Referee profile is inactive");
        }

        ensureRefereeEligible(referee, match);

        match.setRefereeUserId(referee.getUserId());
        var saved = leagueMatchRepository.save(match);
        return toResponse(saved);
    }

    private void ensureRefereeEligible(RefereeProfile referee, LeagueMatch match) {
        if (!containsIgnoreCase(referee.getSports(), match.getSport())) {
            throw new BadRequestException("Referee does not support this sport");
        }

        if (StringUtils.hasText(match.getMatchLocation())
                && !containsIgnoreCase(referee.getAllowedRegions(), match.getMatchLocation())) {
            throw new BadRequestException("Referee does not support the match region");
        }

        if (!StringUtils.hasText(match.getMatchLocation())) {
            var homeTeam = teamClient.getTeam(match.getHomeTeamId());
            var awayTeam = teamClient.getTeam(match.getAwayTeamId());
            if (referee.getAllowedRegions() == null || referee.getAllowedRegions().isEmpty()) {
                throw new BadRequestException("Referee does not share a region with the teams");
            }
            boolean hasOverlap = referee.getAllowedRegions().stream()
                    .anyMatch(region -> containsIgnoreCase(homeTeam.allowedRegions(), region)
                            || containsIgnoreCase(awayTeam.allowedRegions(), region));
            if (!hasOverlap) {
                throw new BadRequestException("Referee does not share a region with the teams");
            }
        }

        boolean isMemberHome = Boolean.TRUE.equals(teamClient.isMember(match.getHomeTeamId(), referee.getUserId()));
        boolean isMemberAway = Boolean.TRUE.equals(teamClient.isMember(match.getAwayTeamId(), referee.getUserId()));
        if (isMemberHome || isMemberAway) {
            throw new BadRequestException("Referee cannot be a member of either team");
        }
    }

    private League requireActiveLeague(UUID leagueId) {
        return leagueRepository.findByIdAndArchivedAtIsNull(leagueId)
                .orElseThrow(() -> new NotFoundException("League not found"));
    }

    private void ensureLeagueOwner(League league, String userId) {
        if (!league.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the league owner can perform this action");
        }
    }

    private void validateTimes(OffsetDateTime startTime, OffsetDateTime endTime) {
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be before endTime");
        }
    }

    private String resolveMatchSport(String homeSport, String awaySport) {
        String normalizedHome = trimToNull(homeSport);
        String normalizedAway = trimToNull(awaySport);
        if (normalizedHome == null || normalizedAway == null) {
            throw new BadRequestException("Teams must have a sport configured");
        }
        if (!normalizedHome.equalsIgnoreCase(normalizedAway)) {
            throw new BadRequestException("Teams must have the same sport");
        }
        return normalizedHome;
    }

    private LeagueMatchResponse toResponse(LeagueMatch match) {
        return new LeagueMatchResponse(
                match.getId(),
                match.getLeague().getId(),
                match.getStatus(),
                match.getHomeTeamId(),
                match.getAwayTeamId(),
                match.getSport(),
                match.getStartTime(),
                match.getEndTime(),
                match.getMatchLocation(),
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

    private boolean containsIgnoreCase(List<String> values, String target) {
        if (target == null || values == null) {
            return false;
        }
        return values.stream().anyMatch(value -> value != null && value.equalsIgnoreCase(target));
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
