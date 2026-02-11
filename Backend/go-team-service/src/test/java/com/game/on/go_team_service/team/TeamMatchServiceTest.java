package com.game.on.go_team_service.team;

import com.game.on.go_team_service.config.CurrentUserProvider;
import com.game.on.go_team_service.exception.BadRequestException;
import com.game.on.go_team_service.exception.ForbiddenException;
import com.game.on.go_team_service.team.dto.TeamMatchCreateRequest;
import com.game.on.go_team_service.team.dto.TeamMatchScoreRequest;
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
class TeamMatchServiceTest {

    @Mock TeamRepository teamRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamMatchRepository teamMatchRepository;
    @Mock TeamMatchInviteRepository teamMatchInviteRepository;
    @Mock TeamMatchScoreRepository teamMatchScoreRepository;
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

        awayTeam = new Team();
        awayTeam.setId(awayTeamId);
        awayTeam.setOwnerUserId(otherUserId);
        awayTeam.setSport("soccer");
        awayTeam.setAllowedRegions(List.of("Montreal"));

        when(teamRepository.findByIdAndDeletedAtIsNull(homeTeamId)).thenReturn(Optional.of(homeTeam));
        when(teamRepository.findByIdAndDeletedAtIsNull(awayTeamId)).thenReturn(Optional.of(awayTeam));
    }

    @Test
    void createMatchInvite_whenCallerNotOwner_throwsForbidden() {
        when(userProvider.clerkUserId()).thenReturn(otherUserId);

        TeamMatchCreateRequest request = new TeamMatchCreateRequest(
                homeTeamId,
                awayTeamId,
                "soccer",
                OffsetDateTime.now().plusDays(1),
                OffsetDateTime.now().plusDays(1).plusHours(1),
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
                "Montreal",
                true,
                null
        );

        assertThrows(BadRequestException.class, () -> teamMatchService.createMatchInvite(UUID.randomUUID(), request));
        verify(teamMatchRepository, never()).save(any());
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
        match.setRefereeUserId(null);

        when(teamMatchRepository.findById(match.getId())).thenReturn(Optional.of(match));
        when(teamMatchScoreRepository.findByMatch_Id(match.getId())).thenReturn(Optional.empty());

        TeamMatchScoreRequest request = new TeamMatchScoreRequest(1, 2);

        assertThrows(ForbiddenException.class, () -> teamMatchService.submitScore(match.getId(), request));
        verify(teamMatchScoreRepository, never()).save(any(TeamMatchScore.class));
    }
}
