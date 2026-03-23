package com.game.on.go_team_service.team;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ConflictException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.team.dto.TeamMatchScheduleValidationResponse;
import com.game.on.go_team_service.team.dto.TeamMatchCreateRequest;
import com.game.on.go_team_service.team.dto.TeamMatchScoreRequest;
import com.game.on.go_team_service.client.LeagueClient;
import com.game.on.go_team_service.team.model.Team;
import com.game.on.go_team_service.team.model.TeamMatch;
import com.game.on.go_team_service.team.model.TeamMatchScore;
import com.game.on.go_team_service.team.model.TeamMatchStatus;
import com.game.on.go_team_service.team.model.TeamMatchType;
import com.game.on.go_team_service.team.repository.TeamMatchInviteRepository;
import com.game.on.go_team_service.team.repository.TeamMatchRepository;
import com.game.on.go_team_service.team.repository.TeamMatchScoreRepository;
import com.game.on.go_team_service.team.repository.TeamMemberRepository;
import com.game.on.go_team_service.team.repository.TeamRepository;
import com.game.on.go_team_service.team.service.TeamMatchService;
import com.game.on.go_team_service.team.service.VenueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class TeamMatchServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamMatchRepository teamMatchRepository;
    @Mock TeamMatchInviteRepository teamMatchInviteRepository;
    @Mock TeamMatchScoreRepository teamMatchScoreRepository;
    @Mock VenueService venueService;
    @Mock LeagueClient leagueClient;
    @Mock CurrentUserProvider userProvider;

    @InjectMocks
    TeamMatchService teamMatchService;

    private final String ownerUserId = "owner_1";
    private final String otherUserId = "user_2";
    private final UUID homeTeamId = UUID.randomUUID();
    private final UUID awayTeamId = UUID.randomUUID();

    private Team homeTeam;
    private Team awayTeam;

    @BeforeEach
    void setup() {
        homeTeam = new Team();
        homeTeam.setId(homeTeamId);
        homeTeam.setOwnerUserId(ownerUserId);
        homeTeam.setSport("soccer");
        homeTeam.setAllowedRegions(List.of("Montreal", "Laval"));
        homeTeam.setTotalPoints(0);
        homeTeam.setTotalMatches(0);
        homeTeam.setWinStreak(0);
        homeTeam.setMinutesPlayed(0);

        awayTeam = new Team();
        awayTeam.setId(awayTeamId);
        awayTeam.setOwnerUserId(otherUserId);
        awayTeam.setSport("soccer");
        awayTeam.setAllowedRegions(List.of("Montreal"));
        awayTeam.setTotalPoints(0);
        awayTeam.setTotalMatches(0);
        awayTeam.setWinStreak(0);
        awayTeam.setMinutesPlayed(0);

        lenient().when(teamRepository.findByIdAndDeletedAtIsNull(homeTeamId)).thenReturn(Optional.of(homeTeam));
        lenient().when(teamRepository.findByIdAndDeletedAtIsNull(awayTeamId)).thenReturn(Optional.of(awayTeam));
        lenient().when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(teamMatchRepository.save(any(TeamMatch.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(teamMatchScoreRepository.save(any(TeamMatchScore.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createMatchInvite_whenCallerNotOwner_throwsForbidden() {
        when(teamRepository.findByIdAndDeletedAtIsNull(homeTeamId)).thenReturn(Optional.of(homeTeam));
        when(teamRepository.findByIdAndDeletedAtIsNull(awayTeamId)).thenReturn(Optional.of(awayTeam));
        when(userProvider.clerkUserId()).thenReturn(otherUserId);

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.now().plusDays(1),
                OffsetDateTime.now().plusDays(1).plusHours(1),
                LocalDate.now().plusDays(1),
                null,
                "Montreal",
                true,
                null
        );

        assertThrows(ForbiddenException.class, () -> teamMatchService.createMatchInvite(homeTeamId, request));
        verify(teamMatchRepository, never()).save(any());
    }

    @Test
    void createMatchInvite_whenPathTeamMismatch_throwsBadRequest() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.now().plusDays(1),
                OffsetDateTime.now().plusDays(1).plusHours(1),
                LocalDate.now().plusDays(1),
                null,
                "Montreal",
                true,
                null
        );

        assertThrows(BadRequestException.class, () -> teamMatchService.createMatchInvite(UUID.randomUUID(), request));
        verify(teamMatchRepository, never()).save(any());
    }

    @Test
    void validateMatchInvite_whenTimeConflict_returnsConflictCode() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);

        TeamMatch existingMatch = new TeamMatch();
        existingMatch.setId(UUID.randomUUID());
        existingMatch.setStatus(TeamMatchStatus.CONFIRMED);
        existingMatch.setStartTime(OffsetDateTime.parse("2026-03-20T14:30:00Z"));
        existingMatch.setEndTime(OffsetDateTime.parse("2026-03-20T15:30:00Z"));
        existingMatch.setScheduledDate(LocalDate.parse("2026-03-20"));

        when(teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(homeTeamId, homeTeamId))
                .thenReturn(List.of(existingMatch));

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.parse("2026-03-20T16:00:00Z"),
                OffsetDateTime.parse("2026-03-20T17:00:00Z"),
                LocalDate.parse("2026-03-20"),
                null,
                "Montreal",
                false,
                null
        );

        TeamMatchScheduleValidationResponse response =
                teamMatchService.validateMatchInvite(homeTeamId, request);

        assertEquals(false, response.allowed());
        assertEquals("TEAM_TIME_SLOT_CONFLICT", response.code());
    }

    @Test
    void createMatchInvite_whenDailyLimitConflict_throwsConflictWithCode() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);

        TeamMatch first = new TeamMatch();
        first.setId(UUID.randomUUID());
        first.setStatus(TeamMatchStatus.CONFIRMED);
        first.setStartTime(OffsetDateTime.parse("2026-03-20T08:00:00Z"));
        first.setEndTime(OffsetDateTime.parse("2026-03-20T09:00:00Z"));
        first.setScheduledDate(LocalDate.parse("2026-03-20"));

        TeamMatch second = new TeamMatch();
        second.setId(UUID.randomUUID());
        second.setStatus(TeamMatchStatus.CONFIRMED);
        second.setStartTime(OffsetDateTime.parse("2026-03-20T10:00:00Z"));
        second.setEndTime(OffsetDateTime.parse("2026-03-20T11:00:00Z"));
        second.setScheduledDate(LocalDate.parse("2026-03-20"));

        TeamMatch third = new TeamMatch();
        third.setId(UUID.randomUUID());
        third.setStatus(TeamMatchStatus.CONFIRMED);
        third.setStartTime(OffsetDateTime.parse("2026-03-20T12:00:00Z"));
        third.setEndTime(OffsetDateTime.parse("2026-03-20T13:00:00Z"));
        third.setScheduledDate(LocalDate.parse("2026-03-20"));

        when(teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(homeTeamId, homeTeamId))
                .thenReturn(List.of(first, second, third));

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.parse("2026-03-20T16:00:00Z"),
                OffsetDateTime.parse("2026-03-20T17:00:00Z"),
                LocalDate.parse("2026-03-20"),
                null,
                "Montreal",
                false,
                null
        );

        ConflictException ex = assertThrows(
                ConflictException.class,
                () -> teamMatchService.createMatchInvite(homeTeamId, request)
        );

        assertEquals("TEAM_DAILY_LIMIT_EXCEEDED", ex.getCode());
    }

    @Test
    void validateMatchInvite_whenRequestedLateEveningMatchesStoredUtcDay_returnsDailyLimitConflict() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);

        TeamMatch first = new TeamMatch();
        first.setId(UUID.randomUUID());
        first.setStatus(TeamMatchStatus.CONFIRMED);
        first.setStartTime(OffsetDateTime.parse("2026-03-19T17:00:00Z"));
        first.setEndTime(OffsetDateTime.parse("2026-03-19T18:30:00Z"));
        first.setScheduledDate(LocalDate.parse("2026-03-19"));

        TeamMatch second = new TeamMatch();
        second.setId(UUID.randomUUID());
        second.setStatus(TeamMatchStatus.CONFIRMED);
        second.setStartTime(OffsetDateTime.parse("2026-03-19T19:00:00Z"));
        second.setEndTime(OffsetDateTime.parse("2026-03-19T19:30:00Z"));
        second.setScheduledDate(LocalDate.parse("2026-03-19"));

        TeamMatch third = new TeamMatch();
        third.setId(UUID.randomUUID());
        third.setStatus(TeamMatchStatus.CONFIRMED);
        third.setStartTime(OffsetDateTime.parse("2026-03-19T21:00:00Z"));
        third.setEndTime(OffsetDateTime.parse("2026-03-19T21:30:00Z"));
        third.setScheduledDate(LocalDate.parse("2026-03-19"));

        when(teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(homeTeamId, homeTeamId))
                .thenReturn(List.of(first, second, third));

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.parse("2026-03-19T21:00:00-04:00"),
                OffsetDateTime.parse("2026-03-19T23:00:00-04:00"),
                LocalDate.parse("2026-03-19"),
                null,
                "Montreal",
                false,
                null
        );

        TeamMatchScheduleValidationResponse response =
                teamMatchService.validateMatchInvite(homeTeamId, request);

        assertEquals(false, response.allowed());
        assertEquals("TEAM_DAILY_LIMIT_EXCEEDED", response.code());
    }

    @Test
    void submitScore_whenNoReferee_onlyCreatorAllowed() {
        String creator = "creator_1";
        when(userProvider.clerkUserId()).thenReturn("other_user");

        TeamMatch match = new TeamMatch();
        match.setId(UUID.randomUUID());
        match.setMatchType(TeamMatchType.TEAM_MATCH);
        match.setStatus(TeamMatchStatus.CONFIRMED);
        match.setCreatedByUserId(creator);
        match.setRequiresReferee(false);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setStartTime(OffsetDateTime.now().minusHours(2));

        when(teamMatchRepository.findById(match.getId())).thenReturn(Optional.of(match));
        when(teamMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.empty());

        TeamMatchScoreRequest request = new TeamMatchScoreRequest(
                1,
                2,
                OffsetDateTime.now().minusHours(1)
        );

        assertThrows(ForbiddenException.class, () -> teamMatchService.submitScore(match.getId(), request));
        verify(teamMatchScoreRepository, never()).save(any(TeamMatchScore.class));
    }

    @Test
    void submitScore_whenRequiresReferee_onlyAssignedRefereeAllowed() {
        when(userProvider.clerkUserId()).thenReturn("not_the_referee");

        TeamMatch match = new TeamMatch();
        match.setId(UUID.randomUUID());
        match.setMatchType(TeamMatchType.TEAM_MATCH);
        match.setStatus(TeamMatchStatus.CONFIRMED);
        match.setRequiresReferee(true);
        match.setRefereeUserId("ref_123");
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setStartTime(OffsetDateTime.now().minusHours(2));

        when(teamMatchRepository.findById(match.getId())).thenReturn(Optional.of(match));
        when(teamMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.empty());

        TeamMatchScoreRequest request = new TeamMatchScoreRequest(
                2,
                1,
                OffsetDateTime.now().minusHours(1)
        );

        assertThrows(ForbiddenException.class, () -> teamMatchService.submitScore(match.getId(), request));
        verify(teamMatchScoreRepository, never()).save(any(TeamMatchScore.class));
    }

    @Test
    void submitScore_whenValid_updatesStatsAndCompletesMatch() {
        when(userProvider.clerkUserId()).thenReturn(ownerUserId);

        OffsetDateTime start = OffsetDateTime.now().minusHours(2);
        OffsetDateTime end = OffsetDateTime.now().minusMinutes(30);

        TeamMatch match = new TeamMatch();
        match.setId(UUID.randomUUID());
        match.setMatchType(TeamMatchType.TEAM_MATCH);
        match.setStatus(TeamMatchStatus.CONFIRMED);
        match.setRequiresReferee(false);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setStartTime(start);
        match.setEndTime(start.plusHours(1));

        when(teamMatchRepository.findById(match.getId())).thenReturn(Optional.of(match));
        when(teamMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.empty());

        TeamMatchScoreRequest request = new TeamMatchScoreRequest(3, 1, end);

        teamMatchService.submitScore(match.getId(), request);

        assertEquals(TeamMatchStatus.COMPLETED, match.getStatus());
        assertEquals(end, match.getEndTime());

        assertEquals(3, homeTeam.getTotalPoints());
        assertEquals(1, homeTeam.getTotalMatches());
        assertEquals(1, homeTeam.getWinStreak());

        assertEquals(0, awayTeam.getTotalPoints());
        assertEquals(1, awayTeam.getTotalMatches());
        assertEquals(0, awayTeam.getWinStreak());

        verify(teamMatchScoreRepository, times(1)).save(any(TeamMatchScore.class));
        verify(teamRepository, atLeast(2)).save(any(Team.class));
        verify(teamMatchRepository, times(1)).save(match);
    }

    @Test
    void getMatch_whenScoreExists_includesScoresInResponse() {
        TeamMatch match = new TeamMatch();
        match.setId(UUID.randomUUID());
        match.setMatchType(TeamMatchType.TEAM_MATCH);
        match.setStatus(TeamMatchStatus.COMPLETED);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setSport("soccer");
        match.setStartTime(OffsetDateTime.now().minusHours(2));
        match.setEndTime(OffsetDateTime.now().minusHours(1));
        match.setRequiresReferee(false);

        TeamMatchScore score = new TeamMatchScore();
        score.setMatch(match);
        score.setHomeScore(4);
        score.setAwayScore(2);

        when(teamMatchRepository.findById(match.getId())).thenReturn(Optional.of(match));
        when(teamMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.of(score));

        var response = teamMatchService.getMatch(match.getId());

        assertEquals(4, response.homeScore());
        assertEquals(2, response.awayScore());
    }

    @Test
    void listTeamMatches_whenScoresExist_includesScoresInResponse() {
        TeamMatch match = new TeamMatch();
        match.setId(UUID.randomUUID());
        match.setMatchType(TeamMatchType.TEAM_MATCH);
        match.setStatus(TeamMatchStatus.COMPLETED);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setSport("soccer");
        match.setStartTime(OffsetDateTime.now().minusHours(3));
        match.setEndTime(OffsetDateTime.now().minusHours(2));
        match.setRequiresReferee(false);

        TeamMatchScore score = new TeamMatchScore();
        score.setMatch(match);
        score.setHomeScore(1);
        score.setAwayScore(1);

        when(teamMatchRepository.findByHomeTeamIdOrAwayTeamIdOrderByStartTimeDesc(homeTeamId, homeTeamId))
                .thenReturn(List.of(match));
        when(teamMatchScoreRepository.findByMatch_IdIn(List.of(match.getId())))
                .thenReturn(List.of(score));

        var responses = teamMatchService.listTeamMatches(homeTeamId);

        assertEquals(1, responses.size());
        assertEquals(1, responses.get(0).homeScore());
        assertEquals(1, responses.get(0).awayScore());
    }
}
