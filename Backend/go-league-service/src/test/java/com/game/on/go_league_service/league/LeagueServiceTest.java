package com.game.on.go_league_service.league;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueTeamResponse;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.mapper.LeagueMapper;
import com.game.on.go_league_service.league.mapper.LeagueTeamMapper;
import com.game.on.go_league_service.league.metrics.LeagueMetricsPublisher;
import com.game.on.go_league_service.league.model.*;
import com.game.on.go_league_service.league.repository.*;
import com.game.on.go_league_service.league.service.LeagueService;
import com.game.on.go_league_service.league.util.SlugGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeagueServiceTest {

    @Mock
    private LeagueRepository leagueRepository;

    @Mock
    private LeagueSeasonRepository leagueSeasonRepository;

    @Mock
    private LeagueMetricsPublisher metricsPublisher;

    @Mock
    private LeagueTeamRepository leagueTeamRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private LeagueTeamMapper leagueTeamMapper;

    @Mock
    private SlugGenerator slugGenerator;

    @Mock
    private TeamClient client;

    @Mock
    private LeagueMatchRepository leagueMatchRepository;

    @Mock
    private LeagueMatchScoreRepository leagueMatchScoreRepository;

    private LeagueService leagueService;

    @BeforeEach
    void setUp() {
        LeagueMapper mapper = new LeagueMapper(slugGenerator);
        leagueService = new LeagueService(
                leagueRepository,
                leagueSeasonRepository,
                mapper,
                leagueTeamRepository,
                leagueTeamMapper,
                client,
                currentUserProvider,
                metricsPublisher,
                leagueMatchRepository,
                leagueMatchScoreRepository
        );
    }

    @Test
    void createLeagueUsesCurrentUserAndDefaultsPrivacyAndLevel() {
        when(currentUserProvider.clerkUserId()).thenReturn("user_123");
        when(slugGenerator.generateUniqueSlug("Downtown League")).thenReturn("downtown-league");

        when(leagueRepository.save(any())).thenAnswer(invocation -> {
            League league = invocation.getArgument(0);
            league.setId(UUID.randomUUID());
            league.setCreatedAt(OffsetDateTime.now());
            league.setUpdatedAt(OffsetDateTime.now());
            return league;
        });

        LeagueCreateRequest request = new LeagueCreateRequest(
                "Downtown League",
                "Soccer",
                "Winter 2025",
                "Montreal",
                "Test description",
                null,
                null
        );

        var response = leagueService.createLeague(request);

        assertThat(response.ownerUserId()).isEqualTo("user_123");
        assertThat(response.slug()).isEqualTo("downtown-league");

        assertThat(response.level()).isEqualTo(LeagueLevel.COMPETITIVE);
        assertThat(response.privacy()).isEqualTo(LeaguePrivacy.PUBLIC);

        assertThat(response.seasonCount()).isZero();

        verify(metricsPublisher).leagueCreated();
    }

    @Test
    void createLeaguePropagatesSlugGenerationFailure() {
        when(currentUserProvider.clerkUserId()).thenReturn("user_1");
        when(slugGenerator.generateUniqueSlug(any()))
                .thenThrow(new BadRequestException("Unable to generate league slug"));

        LeagueCreateRequest request = new LeagueCreateRequest(
                "!!!",
                "soccer",
                "Winter 2025",
                "Montreal",
                "desc",
                LeagueLevel.RECREATIONAL,
                LeaguePrivacy.PUBLIC
        );

        assertThatThrownBy(() -> leagueService.createLeague(request))
                .isInstanceOf(BadRequestException.class);

        verify(leagueRepository, never()).save(any());
        verify(metricsPublisher, never()).leagueCreated();
    }

    @Test
    void updateLeagueAppliesChangesAndReturnsSeasonCount() {
        UUID leagueId = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Old Name")
                .sport("soccer")
                .slug("old-name")
                .ownerUserId("user_77")
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .seasonCount(0)
                .build();

        league.setCreatedAt(OffsetDateTime.now().minusDays(2));
        league.setUpdatedAt(OffsetDateTime.now().minusDays(2));

        when(currentUserProvider.clerkUserId()).thenReturn("user_77");
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId))
                .thenReturn(Optional.of(league));
        when(leagueRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(leagueId))
                .thenReturn(2L);

        LeagueUpdateRequest update = new LeagueUpdateRequest(
                "New Name",
                "volleyball",
                "Ontario",
                "Toronto",
                "Updated description",
                LeagueLevel.RECREATIONAL,
                LeaguePrivacy.PRIVATE
        );


        var response = leagueService.updateLeague(leagueId, update);

        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.sport()).isEqualTo("volleyball");
        assertThat(response.region()).isEqualTo("Ontario");
        assertThat(response.location()).isEqualTo("Toronto");
        assertThat(response.level()).isEqualTo(LeagueLevel.RECREATIONAL);
        assertThat(response.privacy()).isEqualTo(LeaguePrivacy.PRIVATE);
        assertThat(response.seasonCount()).isEqualTo(2L);

        verify(metricsPublisher).leagueUpdated();
    }

    @Test
    void updateLeagueRejectsNoopUpdate() {
        UUID leagueId = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Name")
                .sport("soccer")
                .slug("name")
                .ownerUserId("owner")
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .seasonCount(0)
                .build();

        when(currentUserProvider.clerkUserId()).thenReturn("owner");
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId))
                .thenReturn(Optional.of(league));

        assertThatThrownBy(() ->
                leagueService.updateLeague(
                        leagueId,
                        new LeagueUpdateRequest(null, null, null, null, null, null, null)

                )
        ).isInstanceOf(BadRequestException.class);

        verify(leagueRepository, never()).save(any());
        verify(metricsPublisher, never()).leagueUpdated();
    }

    @Test
    void updateLeagueRejectsNonOwner() {
        UUID leagueId = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Old")
                .sport("soccer")
                .slug("old")
                .ownerUserId("owner")
                .privacy(LeaguePrivacy.PRIVATE)
                .level(LeagueLevel.COMPETITIVE)
                .seasonCount(0)
                .build();

        when(currentUserProvider.clerkUserId()).thenReturn("not-owner");
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId))
                .thenReturn(Optional.of(league));

        assertThatThrownBy(() ->
                leagueService.updateLeague(
                        leagueId,
                        new LeagueUpdateRequest("New", null, null, null, null, null, null)

                )
        ).isInstanceOf(ForbiddenException.class);

        verify(metricsPublisher, never()).leagueUpdated();
    }

    @Test
    void getLeagueBySlugHidesPrivateLeagueFromNonOwner() {
        League league = League.builder()
                .id(UUID.randomUUID())
                .name("Private")
                .sport("soccer")
                .slug("private")
                .ownerUserId("owner")
                .privacy(LeaguePrivacy.PRIVATE)
                .level(LeagueLevel.COMPETITIVE)
                .seasonCount(0)
                .build();

        when(currentUserProvider.clerkUserId()).thenReturn("someone-else");
        when(leagueRepository.findBySlugIgnoreCaseAndArchivedAtIsNull("private"))
                .thenReturn(Optional.of(league));

        assertThatThrownBy(() -> leagueService.getLeagueBySlug("private"))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void listLeaguesReturnsSeasonCountsFromProjection() {
        League league = League.builder()
                .id(UUID.randomUUID())
                .name("Metro League")
                .sport("soccer")
                .slug("metro-league")
                .region("quebec")
                .ownerUserId("user_50")
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .seasonCount(0)
                .build();

        league.setCreatedAt(OffsetDateTime.now());
        league.setUpdatedAt(OffsetDateTime.now());

        when(currentUserProvider.clerkUserId()).thenReturn("user_50");

        when(leagueRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(league), PageRequest.of(0, 20), 1));

        when(leagueSeasonRepository.countActiveSeasonsByLeagueIds(anyCollection()))
                .thenReturn(List.of(new LeagueSeasonRepository.LeagueSeasonCountProjection() {
                    @Override
                    public UUID getLeagueId() {
                        return league.getId();
                    }

                    @Override
                    public long getCount() {
                        return 3;
                    }
                }));

        var response =
                leagueService.listLeagues(
                        new LeagueSearchCriteria(false, null, null, null),
                        0,
                        20
                );

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).seasonCount()).isEqualTo(3);
        assertThat(response.totalElements()).isEqualTo(1);

        verify(metricsPublisher).leagueListQuery();
    }

    @Test
    void getMyLeagueMemberships_returnsEmpty_whenUserHasNoTeams() {
        UUID leagueId = UUID.randomUUID();
        String userId = "user_123";

        League league = mock(League.class);
        LeagueService service = spy(leagueService);

        doReturn(userId).when(currentUserProvider).clerkUserId();
        doReturn(league).when(service).requireActiveLeague(leagueId);
        doNothing().when(service).ensureCanView(league, userId);

        doReturn(Collections.emptyList()).when(service).fetchTeamIdsForUser();

        List<LeagueTeamResponse> result = service.getMyLeagueMemberships(leagueId);

        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(leagueTeamRepository, never()).findByLeague_IdAndTeamId(any(), any());
        verify(leagueTeamMapper, never()).toResponse(any());
    }

    @Test
    void getLeagueStandings_calculatesSoccerStandingsCorrectly() {
        UUID leagueId = UUID.randomUUID();
        String userId = "user_1";

        UUID teamA = UUID.randomUUID();
        UUID teamB = UUID.randomUUID();
        UUID teamC = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Test League")
                .sport("soccer")
                .ownerUserId(userId)
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .build();

        LeagueService service = spy(leagueService);

        doReturn(userId).when(currentUserProvider).clerkUserId();
        doReturn(league).when(service).requireActiveLeague(leagueId);
        doNothing().when(service).ensureCanView(league, userId);

        LeagueTeam lt1 = mock(LeagueTeam.class);
        LeagueTeam lt2 = mock(LeagueTeam.class);
        LeagueTeam lt3 = mock(LeagueTeam.class);

        when(lt1.getTeamId()).thenReturn(teamA);
        when(lt2.getTeamId()).thenReturn(teamB);
        when(lt3.getTeamId()).thenReturn(teamC);

        when(leagueTeamRepository.findByLeague_IdOrderByCreatedAtDesc(leagueId))
                .thenReturn(List.of(lt1, lt2, lt3));

        when(client.getTeam(teamA)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamA, "soccer", List.of(), "owner", "Team A"));
        when(client.getTeam(teamB)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamB, "soccer", List.of(), "owner", "Team B"));
        when(client.getTeam(teamC)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamC, "soccer", List.of(), "owner", "Team C"));

        LeagueMatch match1 = LeagueMatch.builder()
                .id(UUID.randomUUID())
                .league(league)
                .homeTeamId(teamA)
                .awayTeamId(teamB)
                .sport("soccer")
                .startTime(OffsetDateTime.now().minusDays(2))
                .endTime(OffsetDateTime.now().minusDays(2).plusHours(1))
                .requiresReferee(false)
                .status(LeagueMatchStatus.CONFIRMED)
                .createdByUserId(userId)
                .build();

        LeagueMatch match2 = LeagueMatch.builder()
                .id(UUID.randomUUID())
                .league(league)
                .homeTeamId(teamB)
                .awayTeamId(teamC)
                .sport("soccer")
                .startTime(OffsetDateTime.now().minusDays(1))
                .endTime(OffsetDateTime.now().minusDays(1).plusHours(1))
                .requiresReferee(false)
                .status(LeagueMatchStatus.CONFIRMED)
                .createdByUserId(userId)
                .build();

        when(leagueMatchRepository.findByLeague_IdOrderByStartTimeDesc(leagueId))
                .thenReturn(List.of(match1, match2));

        LeagueMatchScore score1 = LeagueMatchScore.builder()
                .id(UUID.randomUUID())
                .match(match1)
                .homeScore(2)
                .awayScore(1)
                .submittedByUserId(userId)
                .build();

        LeagueMatchScore score2 = LeagueMatchScore.builder()
                .id(UUID.randomUUID())
                .match(match2)
                .homeScore(0)
                .awayScore(0)
                .submittedByUserId(userId)
                .build();

        when(leagueMatchScoreRepository.findByMatch_League_Id(leagueId))
                .thenReturn(List.of(score1, score2));

        List<StandingScore> standings = service.getLeagueStandings(leagueId);

        assertThat(standings).hasSize(3);
        assertThat(standings.stream().map(StandingScore::getTeamId).toList())
                .containsExactlyInAnyOrder(teamA, teamB, teamC);

        StandingScore teamAStanding = standings.stream()
                .filter(score -> score.getTeamId().equals(teamA))
                .findFirst()
                .orElseThrow();

        StandingScore teamBStanding = standings.stream()
                .filter(score -> score.getTeamId().equals(teamB))
                .findFirst()
                .orElseThrow();

        StandingScore teamCStanding = standings.stream()
                .filter(score -> score.getTeamId().equals(teamC))
                .findFirst()
                .orElseThrow();

        assertThat(teamAStanding.getPlayed()).isEqualTo(1);
        assertThat(teamAStanding.getWins()).isEqualTo(1);
        assertThat(teamAStanding.getDraws()).isZero();
        assertThat(teamAStanding.getLosses()).isZero();
        assertThat(teamAStanding.getGoalsFor()).isEqualTo(2);
        assertThat(teamAStanding.getGoalsAgainst()).isEqualTo(1);
        assertThat(teamAStanding.getGoalDifference()).isEqualTo(1);
        assertThat(teamAStanding.getPoints()).isEqualTo(3);

        assertThat(teamBStanding.getPlayed()).isEqualTo(2);
        assertThat(teamBStanding.getWins()).isZero();
        assertThat(teamBStanding.getDraws()).isEqualTo(1);
        assertThat(teamBStanding.getLosses()).isEqualTo(1);
        assertThat(teamBStanding.getGoalsFor()).isEqualTo(1);
        assertThat(teamBStanding.getGoalsAgainst()).isEqualTo(2);
        assertThat(teamBStanding.getGoalDifference()).isEqualTo(1);
        assertThat(teamBStanding.getPoints()).isEqualTo(1);

        assertThat(teamCStanding.getPlayed()).isEqualTo(1);
        assertThat(teamCStanding.getWins()).isZero();
        assertThat(teamCStanding.getDraws()).isEqualTo(1);
        assertThat(teamCStanding.getLosses()).isZero();
        assertThat(teamCStanding.getGoalsFor()).isEqualTo(0);
        assertThat(teamCStanding.getGoalsAgainst()).isEqualTo(0);
        assertThat(teamCStanding.getGoalDifference()).isZero();
        assertThat(teamCStanding.getPoints()).isEqualTo(1);
    }


    @Test
    void getLeagueStandings_ignoresMatchesWithoutSubmittedScores() {
        UUID leagueId = UUID.randomUUID();
        String userId = "user_1";

        UUID teamA = UUID.randomUUID();
        UUID teamB = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Test League")
                .sport("soccer")
                .ownerUserId(userId)
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .build();

        LeagueService service = spy(leagueService);

        doReturn(userId).when(currentUserProvider).clerkUserId();
        doReturn(league).when(service).requireActiveLeague(leagueId);
        doNothing().when(service).ensureCanView(league, userId);

        LeagueTeam lt1 = mock(LeagueTeam.class);
        LeagueTeam lt2 = mock(LeagueTeam.class);

        when(lt1.getTeamId()).thenReturn(teamA);
        when(lt2.getTeamId()).thenReturn(teamB);

        when(leagueTeamRepository.findByLeague_IdOrderByCreatedAtDesc(leagueId))
                .thenReturn(List.of(lt1, lt2));

        when(client.getTeam(teamA)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamA, "soccer", List.of(), "owner", "Team A"));
        when(client.getTeam(teamB)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamB, "soccer", List.of(), "owner", "Team B"));

        LeagueMatch match = LeagueMatch.builder()
                .id(UUID.randomUUID())
                .league(league)
                .homeTeamId(teamA)
                .awayTeamId(teamB)
                .sport("soccer")
                .startTime(OffsetDateTime.now())
                .endTime(OffsetDateTime.now().plusHours(1))
                .requiresReferee(false)
                .status(LeagueMatchStatus.CONFIRMED)
                .createdByUserId(userId)
                .build();

        when(leagueMatchRepository.findByLeague_IdOrderByStartTimeDesc(leagueId))
                .thenReturn(List.of(match));

        when(leagueMatchScoreRepository.findByMatch_League_Id(leagueId))
                .thenReturn(Collections.emptyList());

        List<StandingScore> standings = service.getLeagueStandings(leagueId);

        assertThat(standings).hasSize(2);
        assertThat(standings)
                .allSatisfy(score -> {
                    assertThat(score.getPlayed()).isZero();
                    assertThat(score.getPoints()).isZero();
                });
    }


    @Test
    void getLeagueStandings_returnsEmpty_whenLeagueHasNoTeams() {
        UUID leagueId = UUID.randomUUID();
        String userId = "user_1";

        League league = League.builder()
                .id(leagueId)
                .name("Test League")
                .sport("soccer")
                .ownerUserId(userId)
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .build();

        LeagueService service = spy(leagueService);

        doReturn(userId).when(currentUserProvider).clerkUserId();
        doReturn(league).when(service).requireActiveLeague(leagueId);
        doNothing().when(service).ensureCanView(league, userId);

        when(leagueTeamRepository.findByLeague_IdOrderByCreatedAtDesc(leagueId))
                .thenReturn(Collections.emptyList());

        when(leagueMatchRepository.findByLeague_IdOrderByStartTimeDesc(leagueId))
                .thenReturn(Collections.emptyList());

        when(leagueMatchScoreRepository.findByMatch_League_Id(leagueId))
                .thenReturn(Collections.emptyList());

        List<StandingScore> standings = service.getLeagueStandings(leagueId);

        assertThat(standings).isEmpty();
    }


    @Test
    void getLeagueStandings_ignoresMatchWhenTeamNotInLeague() {
        UUID leagueId = UUID.randomUUID();
        String userId = "user_1";

        UUID teamA = UUID.randomUUID();
        UUID teamB = UUID.randomUUID();

        League league = League.builder()
                .id(leagueId)
                .name("Test League")
                .sport("soccer")
                .ownerUserId(userId)
                .privacy(LeaguePrivacy.PUBLIC)
                .level(LeagueLevel.COMPETITIVE)
                .build();

        LeagueService service = spy(leagueService);

        doReturn(userId).when(currentUserProvider).clerkUserId();
        doReturn(league).when(service).requireActiveLeague(leagueId);
        doNothing().when(service).ensureCanView(league, userId);

        LeagueTeam lt1 = mock(LeagueTeam.class);
        when(lt1.getTeamId()).thenReturn(teamA);

        when(leagueTeamRepository.findByLeague_IdOrderByCreatedAtDesc(leagueId))
                .thenReturn(List.of(lt1));

        when(client.getTeam(teamA)).thenReturn(new com.game.on.go_league_service.client.dto.TeamSummaryResponse(
                teamA, "soccer", List.of(), "owner", "Team A"));

        LeagueMatch match = LeagueMatch.builder()
                .id(UUID.randomUUID())
                .league(league)
                .homeTeamId(teamA)
                .awayTeamId(teamB)
                .sport("soccer")
                .startTime(OffsetDateTime.now())
                .endTime(OffsetDateTime.now().plusHours(1))
                .requiresReferee(false)
                .status(LeagueMatchStatus.CONFIRMED)
                .createdByUserId(userId)
                .build();

        when(leagueMatchRepository.findByLeague_IdOrderByStartTimeDesc(leagueId))
                .thenReturn(List.of(match));

        LeagueMatchScore score = LeagueMatchScore.builder()
                .id(UUID.randomUUID())
                .match(match)
                .homeScore(3)
                .awayScore(0)
                .submittedByUserId(userId)
                .build();

        when(leagueMatchScoreRepository.findByMatch_League_Id(leagueId))
                .thenReturn(List.of(score));

        List<StandingScore> standings = service.getLeagueStandings(leagueId);

        assertThat(standings).hasSize(1);
        assertThat(standings.get(0).getPlayed()).isZero();
        assertThat(standings.get(0).getPoints()).isZero();
    }
}
