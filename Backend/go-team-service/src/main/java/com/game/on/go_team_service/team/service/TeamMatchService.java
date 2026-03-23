package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.client.LeagueClient;
import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.exception.NotFoundException;
import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMatch;
import com.game.on.go_team_service.team.model.TeamMatchInvite;
import com.game.on.go_team_service.team.model.TeamMatchInviteStatus;
import com.game.on.go_team_service.team.model.TeamMatchScore;
import com.game.on.go_team_service.team.model.TeamMatchStatus;
import com.game.on.go_team_service.team.model.TeamMatchType;
import com.game.on.go_team_service.team.model.Venue;
import com.game.on.go_team_service.team.model.TeamMatchMember;
import com.game.on.go_team_service.team.model.AttendanceStatus;
import com.game.on.go_team_service.team.model.TeamMember;
import com.game.on.go_team_service.team.model.TeamRole;
import com.game.on.go_team_service.team.repository.TeamMatchInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMatchRepository;
import com.game.on.go_team_service.team.repository.TeamMatchScoreRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.go_team_service.team.repository.TeamMatchMemberRepository;
import com.game.on.go_team_service.team_post.dto.TeamPostCreateRequest;
import com.game.on.go_team_service.team_post.model.TeamPostScope;
import com.game.on.go_team_service.team_post.service.TeamPostService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamMatchService {

    private final int MIN_REST_TIME_MINUTES = 60;
    private final int MAX_MATCHES_PER_DAY = 3;

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamMatchRepository teamMatchRepository;
    private final TeamMatchInviteRepository teamMatchInviteRepository;
    private final TeamMatchScoreRepository teamMatchScoreRepository;
    private final TeamMatchMemberRepository teamMatchMemberRepository;
    private final VenueService venueService;
    private final CurrentUserProvider userProvider;
    private final LeagueClient leagueClient;
    private final TeamPostService teamPostService;

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
        Venue venue = null;
        String matchRegion = trimToNull(request.matchRegion());
        if (request.venueId() != null) {
            venue = venueService.requireVenue(request.venueId());
            matchRegion = trimToNull(venue.getRegion());
            venueService.ensureRegionAllowedForMatch(venue, homeTeam.getId(), awayTeam.getId());
        } else {
            validateRegions(homeTeam, awayTeam, matchRegion);
        }
        validateTimes(request.startTime(), request.endTime());

        if(checkHasSchedulingConflicts(homeTeam.getId(), request.startTime(), request.endTime()) ||
            checkHasSchedulingConflicts(awayTeam.getId(), request.startTime(), request.endTime())) {
            throw new ConflictException("Unable to create invite, another match is booked during this time or you have exceeded the daily limit.");
        }

        TeamMatch match = TeamMatch.builder()
                .matchType(TeamMatchType.TEAM_MATCH)
                .homeTeamId(homeTeam.getId())
                .awayTeamId(awayTeam.getId())
                .sport(matchSport)
                .startTime(request.startTime())
                .endTime(request.endTime())
                .matchLocation(venue != null ? venue.getName() : matchRegion)
                .venueId(venue == null ? null : venue.getId())
                .requiresReferee(Boolean.TRUE.equals(request.requiresReferee()))
                .status(TeamMatchStatus.PENDING_TEAM_ACCEPTANCE)
                .notes(trimToNull(request.notes()))
                .createdByUserId(userId)
                .build();

        var savedMatch = teamMatchRepository.save(match);

        addTeamMembersToMatch(savedMatch, homeTeam.getId(), true);
        addTeamMembersToMatch(savedMatch, awayTeam.getId(), false);

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
        var matches = teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(teamId, teamId);
        if (matches.isEmpty()) {
            return List.of();
        }

        var matchIds = matches.stream()
            .map(TeamMatch::getId)
            .toList();

        Map<UUID, TeamMatchScore> scoresByMatchId = teamMatchScoreRepository.findByMatch_IdIn(matchIds)
            .stream()
            .collect(Collectors.toMap(score -> score.getMatch().getId(), Function.identity()));

        return matches.stream()
            .map(match -> toResponse(match, scoresByMatchId.get(match.getId())))
            .toList();
    }

    @Transactional(readOnly = true)
    public TeamMatchResponse getMatch(UUID matchId) {
        var match = teamMatchRepository.findById(matchId)
                .orElseThrow(() -> new NotFoundException("Match not found"));
        var score = teamMatchScoreRepository.findByMatch_Id(matchId).orElse(null);
        return toResponse(match, score);
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

        if(checkHasSchedulingConflicts(match.getHomeTeamId(), match.getStartTime(), match.getEndTime())
                || checkHasSchedulingConflicts(match.getAwayTeamId(), match.getStartTime(), match.getEndTime())) {
            invite.setStatus(TeamMatchInviteStatus.DECLINED);
            invite.setRespondedAt(OffsetDateTime.now());
            teamMatchInviteRepository.save(invite);

            match.setStatus(TeamMatchStatus.CANCELLED);
            teamMatchRepository.save(match);
            throw new ConflictException("Another match was confirmed in this time slot before this match was confirmed, or your daily limit is exceeded at the time of acceptance.");
        }

        invite.setStatus(TeamMatchInviteStatus.ACCEPTED);
        invite.setRespondedAt(OffsetDateTime.now());
        teamMatchInviteRepository.save(invite);

        List<TeamMatchMember> awayMembers = teamMatchMemberRepository.findByMatch_IdAndTeamId(match.getId(), awayTeam.getId());
        awayMembers.forEach(member -> member.setAttending(AttendanceStatus.CONFIRMED));
        teamMatchMemberRepository.saveAll(awayMembers);

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

        List<TeamMatchMember> allMembers = teamMatchMemberRepository.findByMatch_Id(match.getId());
        teamMatchMemberRepository.deleteAll(allMembers);


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

        if (match.getStatus() != TeamMatchStatus.CONFIRMED) {
            throw new BadRequestException("Only confirmed matches can have a final score submitted");
        }

        teamMatchScoreRepository.findByMatch_Id(matchId).ifPresent(score -> {
            throw new ConflictException("Final score already submitted");
        });

        Team homeTeam = requireActiveTeam(match.getHomeTeamId());
        Team awayTeam = requireActiveTeam(match.getAwayTeamId());

        validateScoreSubmissionPermissions(match, homeTeam, awayTeam, userId);
        validateSubmittedEndTime(match.getStartTime(), request.endTime());

        TeamMatchScore score = TeamMatchScore.builder()
                .match(match)
                .homeScore(request.homeScore())
                .awayScore(request.awayScore())
                .officialEndTime(request.endTime())
                .submittedByUserId(userId)
                .build();
        teamMatchScoreRepository.save(score);

        match.setEndTime(request.endTime());
        match.setStatus(TeamMatchStatus.COMPLETED);
        teamMatchRepository.save(match);

        updateTeamStatistics(
                homeTeam,
                awayTeam,
                request.homeScore(),
                request.awayScore(),
                match.getStartTime(),
                request.endTime()
        );

        log.info("team_match_score_submitted matchId={} submittedBy={} homeScore={} awayScore={}",
                matchId, userId, request.homeScore(), request.awayScore());
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

    private boolean checkHasSchedulingConflicts(UUID team, OffsetDateTime startTime, OffsetDateTime endTime) {
        var allTeamMatches = teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(team, team);

        int curMatchCount = 0;

        for(var match : allTeamMatches) {
            boolean isSameDay = (match.getStartTime().getYear() == startTime.getYear()
                    && match.getStartTime().getDayOfYear() == startTime.getDayOfYear());
            boolean isConfirmed = match.getStatus() == TeamMatchStatus.CONFIRMED;

            if(isSameDay && isConfirmed) {
                curMatchCount++;
            }

            if(curMatchCount >= MAX_MATCHES_PER_DAY){
                return true;
            }

            // Rest time included
            boolean isBetweenStartAndEndTime = (match.getStartTime().isAfter(startTime.minusMinutes(MIN_REST_TIME_MINUTES))
                    && match.getStartTime().isBefore(endTime.plusMinutes(MIN_REST_TIME_MINUTES)))
                    || (match.getEndTime().isAfter(startTime.minusMinutes(MIN_REST_TIME_MINUTES))
                    && match.getEndTime().isBefore(endTime.plusMinutes(MIN_REST_TIME_MINUTES)));

            boolean isOverlapped = ((startTime.isBefore(match.getStartTime()) && endTime.isAfter(match.getEndTime()))
                                || (match.getStartTime().isBefore(startTime) && match.getEndTime().isAfter(endTime)));

            if((isBetweenStartAndEndTime || isOverlapped) && isConfirmed) {
                return true;
            }
        }

        var allLeagueMatches = leagueClient.getLeagueMatchesForTeam(team);

        for(var match : allLeagueMatches) {
            boolean isSameDay = (match.startTime().getYear() == startTime.getYear()
                    && match.startTime().getDayOfYear() == startTime.getDayOfYear());
            boolean isConfirmed = match.status().equalsIgnoreCase("confirmed");

            if(isSameDay && isConfirmed) {
                curMatchCount++;
            }

            if(curMatchCount >= MAX_MATCHES_PER_DAY){
                return true;
            }

            // Rest time included
            boolean isBetweenStartAndEndTime = (match.startTime().isAfter(startTime.minusMinutes(MIN_REST_TIME_MINUTES))
                    && match.startTime().isBefore(endTime.plusMinutes(MIN_REST_TIME_MINUTES)))
                    || (match.endTime().isAfter(startTime.minusMinutes(MIN_REST_TIME_MINUTES))
                    && match.endTime().isBefore(endTime.plusMinutes(MIN_REST_TIME_MINUTES)));

            boolean isOverlapped = ((startTime.isBefore(match.startTime()) && endTime.isAfter(match.endTime()))
                    || (match.startTime().isBefore(startTime) && match.endTime().isAfter(endTime)));

            if((isBetweenStartAndEndTime || isOverlapped) && isConfirmed) {
                return true;
            }
        }

        return false;
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
        return toResponse(match, null);
    }

    private TeamMatchResponse toResponse(TeamMatch match, TeamMatchScore score) {
        return new TeamMatchResponse(
                match.getId(),
                match.getMatchType(),
                match.getStatus(),
                match.getHomeTeamId(),
                match.getAwayTeamId(),
                score == null ? null : score.getHomeScore(),
                score == null ? null : score.getAwayScore(),
                match.getSport(),
                match.getStartTime(),
                match.getEndTime(),
                match.getMatchLocation(),
                match.getVenueId(),
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

    private void validateScoreSubmissionPermissions(TeamMatch match, Team homeTeam, Team awayTeam, String userId) {
        if (match.isRequiresReferee()) {
            if (!StringUtils.hasText(match.getRefereeUserId())) {
                throw new BadRequestException("This match requires a referee before a score can be submitted");
            }

            if (!match.getRefereeUserId().equals(userId)) {
                throw new ForbiddenException("Only the assigned referee can submit the score");
            }
            return;
        }

        boolean isHomeOwner = homeTeam.getOwnerUserId().equals(userId);
        boolean isAwayOwner = awayTeam.getOwnerUserId().equals(userId);

        if (!isHomeOwner && !isAwayOwner) {
            throw new ForbiddenException("Only one of the team owners can submit the score when no referee is required");
        }
    }

    private void validateSubmittedEndTime(OffsetDateTime startTime, OffsetDateTime submittedEndTime) {
        if (submittedEndTime == null) {
            throw new BadRequestException("endTime is required");
        }
        if (startTime == null) {
            throw new BadRequestException("Match start time is missing");
        }
        if (!submittedEndTime.isAfter(startTime)) {
            throw new BadRequestException("Submitted endTime must be after the match startTime");
        }
    }

    private void updateTeamStatistics(
            Team homeTeam,
            Team awayTeam,
            int homeScore,
            int awayScore,
            OffsetDateTime startTime,
            OffsetDateTime endTime
    ) {
        int playedMinutes = (int) Math.max(0, Duration.between(startTime, endTime).toMinutes());

        incrementCommonStats(homeTeam, playedMinutes);
        incrementCommonStats(awayTeam, playedMinutes);

        if (homeScore > awayScore) {
            homeTeam.setTotalPoints(safeInt(homeTeam.getTotalPoints()) + 3);
            homeTeam.setWinStreak(safeInt(homeTeam.getWinStreak()) + 1);

            awayTeam.setWinStreak(0);
        } else if (awayScore > homeScore) {
            awayTeam.setTotalPoints(safeInt(awayTeam.getTotalPoints()) + 3);
            awayTeam.setWinStreak(safeInt(awayTeam.getWinStreak()) + 1);

            homeTeam.setWinStreak(0);
        } else {
            homeTeam.setTotalPoints(safeInt(homeTeam.getTotalPoints()) + 1);
            awayTeam.setTotalPoints(safeInt(awayTeam.getTotalPoints()) + 1);

            homeTeam.setWinStreak(0);
            awayTeam.setWinStreak(0);
        }

        teamRepository.save(homeTeam);
        teamRepository.save(awayTeam);
    }

    private void incrementCommonStats(Team team, int playedMinutes) {
        team.setTotalMatches(safeInt(team.getTotalMatches()) + 1);
        team.setMinutesPlayed(safeInt(team.getMinutesPlayed()) + playedMinutes);
    }

    private void addTeamMembersToMatch(TeamMatch match, UUID teamId, Boolean isHomeTeam) {
        List<TeamMember> players = teamMemberRepository
                .findByTeamIdAndRole(teamId, TeamRole.PLAYER);

        AttendanceStatus status = isHomeTeam
                ? AttendanceStatus.CONFIRMED
                : AttendanceStatus.PENDING;

        List<TeamMatchMember> matchMembers = players.stream()
                .map(member -> TeamMatchMember.builder()
                        .match(match)
                        .teamMember(member)
                        .teamId(teamId)
                        .role(member.getRole())
                        .attending(status)
                        .joinedAt(OffsetDateTime.now())
                        .build()
                )
                .toList();

        teamMatchMemberRepository.saveAll(matchMembers);
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    public void updateAttendance(UUID matchId, UpdateMatchAttendanceRequest request) {
        String userId = userProvider.clerkUserId();

        if (request.attending() == null) {
            throw new BadRequestException("Attendance status must be provided");
        }

        if (request.attending() == AttendanceStatus.PENDING) {
            throw new BadRequestException("Cannot set status to PENDING");
        }

        TeamMatchMember member = teamMatchMemberRepository
                .findByMatch_IdAndTeamMember_UserId(matchId, userId)
                .orElseThrow(() -> new NotFoundException("Player not found in match"));

        if (request.attending() == AttendanceStatus.DECLINED) {
            List<TeamMember> replacements = teamMemberRepository
                    .findByTeamIdAndRole(member.getTeamId(), TeamRole.REPLACEMENT);

            List<TeamMatchMember> replacementMatchMembers = replacements.stream()
                    .map(r -> TeamMatchMember.builder()
                            .match(member.getMatch())
                            .teamMember(r)
                            .teamId(member.getTeamId())
                            .role(r.getRole())
                            .attending(AttendanceStatus.PENDING)
                            .joinedAt(OffsetDateTime.now())
                            .build())
                    .toList();


            TeamMatch match = teamMatchRepository.findById(matchId)
                    .orElseThrow(() -> new NotFoundException("Match not found"));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String matchDateStr = match.getStartTime().format(formatter);

            teamMatchMemberRepository.saveAll(replacementMatchMembers);
            TeamPostCreateRequest postRequest = new TeamPostCreateRequest(
                    "Replacement Needed",
                    member.getTeamId(),
                    "A player is unavailable for the upcoming match on " + matchDateStr,
                    TeamPostScope.MEMBERS
            );

            teamPostService.createSystemPost(
                    member.getTeamId(),
                    postRequest
            );
        }

        if (member.getAttending() == request.attending()) {
            return;
        }

        member.setAttending(request.attending());

        teamMatchMemberRepository.save(member);
    }

    @Transactional(readOnly = true)
    public Map<UUID, List<TeamMatchMemberResponse>> getMatchMembers(UUID matchId) {
        List<TeamMatchMember> allMembers = teamMatchMemberRepository.findByMatch_Id(matchId);
        List<TeamMatchMemberResponse> dtoList = allMembers.stream()
                .map(m -> new TeamMatchMemberResponse(
                        m.getId(),
                        m.getTeamId(),
                        m.getTeamMember().getUserId(),
                        m.getRole(),
                        m.getAttending()
                ))
                .toList();

        return dtoList.stream()
                .collect(Collectors.groupingBy(TeamMatchMemberResponse::teamId));
    }
    @Transactional(readOnly = true)
    public List<TeamMatchMemberResponse> getMatchMembersByTeam(UUID matchId, UUID teamId) {

        return teamMatchMemberRepository.findByMatch_IdAndTeamId(matchId, teamId)
                .stream()
                .map(member -> new TeamMatchMemberResponse(
                        member.getId(),
                        member.getTeamId(),
                        member.getTeamMember().getUserId(),
                        member.getRole(),
                        member.getAttending()
                ))
                .toList();
    }
}
