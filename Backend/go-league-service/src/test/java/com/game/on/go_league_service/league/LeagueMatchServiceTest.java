package com.game.on.go_league_service.league;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.client.dto.TeamSummaryResponse;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.league.dto.AssignRefereeRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchCreateRequest;
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
import com.game.on.go_league_service.league.service.LeagueMatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeagueMatchServiceTest {

    @Mock LeagueRepository leagueRepository;
    @Mock LeagueTeamRepository leagueTeamRepository;
    @Mock LeagueMatchRepository leagueMatchRepository;
    @Mock LeagueMatchScoreRepository leagueMatchScoreRepository;
    @Mock RefereeProfileRepository refereeProfileRepository;
    @Mock TeamClient teamClient;
    @Mock CurrentUserProvider userProvider;

    @InjectMocks
    LeagueMatchService leagueMatchService;

    private final UUID leagueId = UUID.randomUUID();
    private final UUID homeTeamId = UUID.randomUUID();
    private final UUID awayTeamId = UUID.randomUUID();
    private League league;

    @BeforeEach
    void setup() {
        league = new League();
        league.setId(leagueId);
        league.setOwnerUserId("owner_1");
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
    }

    @Test
    void createMatch_requiresRefereeTrue() {
        when(userProvider.clerkUserId()).thenReturn("owner_1");

        LeagueMatchCreateRequest request = new LeagueMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                OffsetDateTime.now().plusDays(1),
                OffsetDateTime.now().plusDays(1).plusHours(1),
                "Montreal",
                false,
                "ref_1"
        );

        assertThrows(BadRequestException.class, () -> leagueMatchService.createMatch(leagueId, request));
        verify(leagueMatchRepository, never()).save(any());
    }

    @Test
    void createMatch_refereeWithoutSharedRegion_throwsBadRequest() {
        when(userProvider.clerkUserId()).thenReturn("owner_1");
        when(leagueTeamRepository.existsByLeague_IdAndTeamId(leagueId, homeTeamId)).thenReturn(true);
        when(leagueTeamRepository.existsByLeague_IdAndTeamId(leagueId, awayTeamId)).thenReturn(true);
        when(teamClient.getTeam(homeTeamId)).thenReturn(
                new TeamSummaryResponse(homeTeamId, "soccer", List.of("Montreal"), "owner_1")
        );
        when(teamClient.getTeam(awayTeamId)).thenReturn(
                new TeamSummaryResponse(awayTeamId, "soccer", List.of("Montreal"), "owner_2")
        );

        RefereeProfile referee = new RefereeProfile();
        referee.setUserId("ref_1");
        referee.setActive(true);
        referee.setSports(List.of("soccer"));
        referee.setAllowedRegions(List.of("Toronto"));
        when(refereeProfileRepository.findById("ref_1")).thenReturn(Optional.of(referee));

        LeagueMatchCreateRequest request = new LeagueMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                OffsetDateTime.now().plusDays(1),
                OffsetDateTime.now().plusDays(1).plusHours(1),
                null,
                true,
                "ref_1"
        );

        assertThrows(BadRequestException.class, () -> leagueMatchService.createMatch(leagueId, request));
        verify(leagueMatchRepository, never()).save(any());
    }

    @Test
    void assignReferee_conflictOfInterest_throwsBadRequest() {
        when(userProvider.clerkUserId()).thenReturn("owner_1");

        LeagueMatch match = new LeagueMatch();
        match.setId(UUID.randomUUID());
        match.setLeague(league);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setSport("soccer");
        match.setStatus(LeagueMatchStatus.CONFIRMED);

        when(leagueMatchRepository.findByIdAndLeague_Id(match.getId(), leagueId)).thenReturn(Optional.of(match));

        RefereeProfile referee = new RefereeProfile();
        referee.setUserId("ref_1");
        referee.setActive(true);
        referee.setSports(List.of("soccer"));
        referee.setAllowedRegions(List.of("Montreal"));

        when(refereeProfileRepository.findById("ref_1")).thenReturn(Optional.of(referee));
        when(teamClient.isMember(homeTeamId, "ref_1")).thenReturn(true);

        when(teamClient.getTeam(homeTeamId)).thenReturn(new TeamSummaryResponse(homeTeamId, "soccer", List.of("Montreal"), "owner_1"));
        when(teamClient.getTeam(awayTeamId)).thenReturn(new TeamSummaryResponse(awayTeamId, "soccer", List.of("Montreal"), "owner_2"));

        AssignRefereeRequest request = new AssignRefereeRequest("ref_1");

        assertThrows(BadRequestException.class, () -> leagueMatchService.assignReferee(leagueId, match.getId(), request));
        verify(leagueMatchRepository, never()).save(any());
    }

    @Test
    void submitScore_whenNoReferee_ownerAllowed() {
        when(userProvider.clerkUserId()).thenReturn("owner_1");

        LeagueMatch match = new LeagueMatch();
        match.setId(UUID.randomUUID());
        match.setLeague(league);
        match.setRefereeUserId(null);

        when(leagueMatchRepository.findByIdAndLeague_Id(match.getId(), leagueId)).thenReturn(Optional.of(match));
        when(leagueMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.empty());

        LeagueMatchScoreRequest request = new LeagueMatchScoreRequest(2, 1);

        leagueMatchService.submitScore(leagueId, match.getId(), request);
        verify(leagueMatchScoreRepository).save(any(LeagueMatchScore.class));
    }
}
