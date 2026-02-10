package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.dto.TeamMatchCancelRequest;
import com.game.on.go_team_service.team.dto.TeamMatchCreateRequest;
import com.game.on.go_team_service.team.dto.TeamMatchResponse;
import com.game.on.go_team_service.team.dto.TeamMatchScoreRequest;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMatch;
import com.game.on.go_team_service.team.model.TeamMatchInvite;
import com.game.on.go_team_service.team.model.TeamMatchInviteStatus;
import com.game.on.go_team_service.team.model.TeamMatchScore;
import com.game.on.go_team_service.team.model.TeamMatchStatus;
import com.game.on.go_team_service.team.model.TeamMatchType;
import com.game.on.go_team_service.team.repository.TeamMatchInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMatchRepository;
import com.game.on.go_team_service.team.repository.TeamMatchScoreRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
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
public class TeamMatchService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamMatchRepository teamMatchRepository;
    private final TeamMatchInviteRepository teamMatchInviteRepository;
    private final TeamMatchScoreRepository teamMatchScoreRepository;
    private final CurrentUserProvider userProvider;

    @Transactional
    public TeamMatchResponse createMatchInvite(UUID teamId, TeamMatchCreateRequest request) {
        String userId = userProvider.clerkUserId();

        if (!teamId.equals(request.homeTeamId())) {
            throw new BadRequestException("teamId in path must match homeTeamId");
        }

        Team homeTeam = requireActiveTeam(request.homeTeamId());
        Team awayTeam = requireActiveTeam(request.awayTeamId());

        if (!homeTeam.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the team owner can create team matches");
        }
        if (homeTeam.getId().equals(awayTeam.getId())) {
            throw new BadRequestException("homeTeamId and awayTeamId must be different");
        }

        String matchSport = resolveMatchSport(request.sport(), homeTeam, awayTeam);
        validateRegions(homeTeam, awayTeam, request.matchRegion());
        validateTimes(request.startTime(), request.endTime());

        TeamMatch match = TeamMatch.builder()
                .matchType(TeamMatchType.TEAM_MATCH)
                .homeTeamId(homeTeam.getId())
                .awayTeamId(awayTeam.getId())
                .sport(matchSport)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .matchLocation(trimToNull(request.matchRegion()))
                .requiresReferee(Boolean.TRUE.equals(request.requiresReferee()))
                .status(TeamMatchStatus.PENDING_TEAM_ACCEPTANCE)
                .notes(trimToNull(request.notes()))
                .createdByUserId(userId)
                .build();

        var savedMatch = teamMatchRepository.save(match);

        TeamMatchInvite invite = TeamMatchInvite.builder()
                .match(savedMatch)
                .invitedTeamId(awayTeam.getId())
                .invitedByUserId(userId)
                .status(TeamMatchInviteStatus.PENDING)
                .build();
        teamMatchInviteRepository.save(invite);

        log.info("team_match_created matchId={} homeTeamId={} awayTeamId={} byUser={}",
                savedMatch.getId(), homeTeam.getId(), awayTeam.getId(), userId);

        return toResponse(savedMatch);
    }

    @Transactional(readOnly = true)
    public List<TeamMatchResponse> listTeamMatches(UUID teamId) {
        requireActiveTeam(teamId);
        return teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(teamId, teamId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TeamMatchResponse getMatch(UUID matchId) {
        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));
        return toResponse(match);
    }

    @Transactional
    public TeamMatchResponse acceptInvite(UUID matchId) {
        String userId = userProvider.clerkUserId();

        var match = requirePendingMatch(matchId);
        var invite = teamMatchInviteRepository.findByMatch_IdAndStatus(matchId, TeamMatchInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        Team awayTeam = requireActiveTeam(match.getAwayTeamId());
        if (!awayTeam.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the away team owner can accept the invite");
        }

        invite.setStatus(TeamMatchInviteStatus.ACCEPTED);
        invite.setRespondedAt(OffsetDateTime.now());
        teamMatchInviteRepository.save(invite);

        match.setStatus(TeamMatchStatus.CONFIRMED);
        var saved = teamMatchRepository.save(match);

        return toResponse(saved);
    }

    @Transactional
    public TeamMatchResponse declineInvite(UUID matchId) {
        String userId = userProvider.clerkUserId();

        var match = requirePendingMatch(matchId);
        var invite = teamMatchInviteRepository.findByMatch_IdAndStatus(matchId, TeamMatchInviteStatus.PENDING)
                .orElseThrow(() -> new NotFoundException("Invite not found"));

        Team awayTeam = requireActiveTeam(match.getAwayTeamId());
        if (!awayTeam.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only the away team owner can decline the invite");
        }

        invite.setStatus(TeamMatchInviteStatus.DECLINED);
        invite.setRespondedAt(OffsetDateTime.now());
        teamMatchInviteRepository.save(invite);

        match.setStatus(TeamMatchStatus.DECLINED);
        var saved = teamMatchRepository.save(match);

        return toResponse(saved);
    }

    @Transactional
    public TeamMatchResponse cancelMatch(UUID matchId, TeamMatchCancelRequest request) {
        String userId = userProvider.clerkUserId();

        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        Team homeTeam = requireActiveTeam(match.getHomeTeamId());
        Team awayTeam = requireActiveTeam(match.getAwayTeamId());

        if (!homeTeam.getOwnerUserId().equals(userId) && !awayTeam.getOwnerUserId().equals(userId)) {
            throw new ForbiddenException("Only team owners can cancel the match");
        }

        match.setStatus(TeamMatchStatus.CANCELLED);
        match.setCancelledAt(OffsetDateTime.now());
        match.setCancelledByUserId(userId);
        match.setCancelReason(trimToNull(request == null ? null : request.reason()));

        var saved = teamMatchRepository.save(match);
        return toResponse(saved);
    }

    @Transactional
    public void submitScore(UUID matchId, TeamMatchScoreRequest request) {
        String userId = userProvider.clerkUserId();

        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        teamMatchScoreRepository.findByMatch_Id(matchId).ifPresent(score -> {
            throw new ConflictException("Final score already submitted");
        });

        if (StringUtils.hasText(match.getRefereeUserId())) {
            if (!match.getRefereeUserId().equals(userId)) {
                throw new ForbiddenException("Only the referee can submit the score");
            }
        } else if (!match.getCreatedByUserId().equals(userId)) {
            throw new ForbiddenException("Only the match creator can submit the score when no referee is assigned");
        }

        TeamMatchScore score = TeamMatchScore.builder()
                .match(match)
                .homeScore(request.homeScore())
                .awayScore(request.awayScore())
                .submittedByUserId(userId)
                .build();
        teamMatchScoreRepository.save(score);
    }

    @Transactional
    public void assignReferee(UUID matchId) {
        String userId = userProvider.clerkUserId();

        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));

        if (match.getMatchType() != TeamMatchType.TEAM_MATCH) {
            throw new BadRequestException("Referee assignment only supported for team matches");
        }

        if (StringUtils.hasText(match.getRefereeUserId())) {
            throw new ConflictException("Referee already assigned");
        }

        if (teamMemberRepository.existsByTeamIdAndUserId(match.getHomeTeamId(), userId)
                || teamMemberRepository.existsByTeamIdAndUserId(match.getAwayTeamId(), userId)) {
            throw new BadRequestException("Referee cannot be a member of either team");
        }

        match.setRefereeUserId(userId);
        teamMatchRepository.save(match);
    }

    private TeamMatch requirePendingMatch(UUID matchId) {
        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));
        if (match.getStatus() != TeamMatchStatus.PENDING_TEAM_ACCEPTANCE) {
            throw new BadRequestException("Match is not pending team acceptance");
        }
        return match;
    }

    private void validateTimes(OffsetDateTime startTime, OffsetDateTime endTime) {
        if (startTime == null || endTime == null || !startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be before endTime");
        }
    }

    private String resolveMatchSport(String requestedSport, Team homeTeam, Team awayTeam) {
        String matchSport = trimToNull(requestedSport);
        if (matchSport == null) {
            matchSport = trimToNull(homeTeam.getSport());
        }
        if (matchSport == null) {
            throw new BadRequestException("sport is required for match");
        }
        if (!matchSport.equalsIgnoreCase(trimToNull(homeTeam.getSport()))
                || !matchSport.equalsIgnoreCase(trimToNull(awayTeam.getSport()))) {
            throw new BadRequestException("Teams must have the same sport");
        }
        return matchSport;
    }

    private void validateRegions(Team homeTeam, Team awayTeam, String matchRegion) {
        List<String> homeRegions = normalizeRegions(homeTeam.getAllowedRegions());
        List<String> awayRegions = normalizeRegions(awayTeam.getAllowedRegions());

        if (homeRegions.isEmpty() || awayRegions.isEmpty()) {
            throw new BadRequestException("Both teams must have allowed regions configured");
        }

        String region = trimToNull(matchRegion);
        if (region != null) {
            if (!containsIgnoreCase(homeRegions, region) || !containsIgnoreCase(awayRegions, region)) {
                throw new BadRequestException("matchRegion must be allowed by both teams");
            }
            return;
        }

        boolean intersects = homeRegions.stream().anyMatch(candidate -> containsIgnoreCase(awayRegions, candidate));
        if (!intersects) {
            throw new BadRequestException("Teams must share at least one allowed region");
        }
    }

    private Team requireActiveTeam(UUID teamId) {
        return teamRepository.findByIdAndDeletedAtIsNull(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));
    }

    private TeamMatchResponse toResponse(TeamMatch match) {
        return new TeamMatchResponse(
                match.getId(),
                match.getMatchType(),
                match.getStatus(),
                match.getHomeTeamId(),
                match.getAwayTeamId(),
                match.getSport(),
                match.getStartTime(),
                match.getEndTime(),
                match.getMatchLocation(),
                match.isRequiresReferee(),
                match.getRefereeUserId(),
                match.getNotes(),
                match.getCreatedByUserId(),
                match.getCancelledByUserId(),
                match.getCancelReason(),
                match.getCancelledAt(),
                match.getCreatedAt(),
                match.getUpdatedAt()
        );
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private List<String> normalizeRegions(List<String> regions) {
        if (regions == null) {
            return List.of();
        }
        return regions.stream()
                .map(region -> region == null ? null : region.trim())
                .filter(region -> region != null && !region.isBlank())
                .distinct()
                .toList();
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        if (target == null || values == null) {
            return false;
        }
        return values.stream().anyMatch(value -> value != null && value.equalsIgnoreCase(target));
    }
}
