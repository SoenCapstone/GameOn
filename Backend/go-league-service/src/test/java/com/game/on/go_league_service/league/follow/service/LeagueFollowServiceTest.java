package com.game.on.go_league_service.league.follow.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.follow.model.LeagueFollow;
import com.game.on.go_league_service.league.follow.repository.LeagueFollowRepository;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.repository.LeagueOrganizerRepository;
import com.game.on.go_league_service.league.repository.LeagueTeamRepository;
import com.game.on.go_league_service.league.service.LeagueService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeagueFollowServiceTest {

    @Mock
    LeagueService leagueService;

    @Mock
    LeagueFollowRepository leagueFollowRepository;

    @Mock
    LeagueOrganizerRepository organizerRepository;

    @Mock
    LeagueTeamRepository leagueTeamRepository;

    @Mock
    CurrentUserProvider currentUserProvider;

    @InjectMocks
    LeagueFollowService service;

    private final String userId = "user_clerk_1";
    private final UUID leagueId = UUID.randomUUID();

    @Test
    void follow_succeeds_whenPublicOutsider_andSaves() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PUBLIC));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, userId)).thenReturn(false);
        when(leagueService.fetchTeamIdsForUser()).thenReturn(List.of());
        when(leagueFollowRepository.existsByLeagueIdAndUserId(leagueId, userId)).thenReturn(false);

        service.follow(leagueId);

        ArgumentCaptor<LeagueFollow> captor = ArgumentCaptor.forClass(LeagueFollow.class);
        verify(leagueFollowRepository).save(captor.capture());
        assertThat(captor.getValue().getLeagueId()).isEqualTo(leagueId);
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    void follow_isIdempotent_whenAlreadyFollowing() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PUBLIC));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, userId)).thenReturn(false);
        when(leagueService.fetchTeamIdsForUser()).thenReturn(List.of());
        when(leagueFollowRepository.existsByLeagueIdAndUserId(leagueId, userId)).thenReturn(true);

        service.follow(leagueId);

        verify(leagueFollowRepository, never()).save(any());
    }

    @Test
    void follow_throwsForbidden_whenPrivateLeague() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PRIVATE));

        assertThatThrownBy(() -> service.follow(leagueId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("public");
    }

    @Test
    void follow_throwsForbidden_whenOwner() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        League lg = league(LeaguePrivacy.PUBLIC);
        lg.setOwnerUserId(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(lg);

        assertThatThrownBy(() -> service.follow(leagueId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void follow_throwsForbidden_whenOrganizer() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PUBLIC));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, userId)).thenReturn(true);

        assertThatThrownBy(() -> service.follow(leagueId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void follow_throwsForbidden_whenTeamInLeague() {
        UUID teamId = UUID.randomUUID();
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PUBLIC));
        when(organizerRepository.existsByLeague_IdAndUserId(leagueId, userId)).thenReturn(false);
        when(leagueService.fetchTeamIdsForUser()).thenReturn(List.of(teamId));
        when(leagueTeamRepository.existsByLeague_IdAndTeamIdIn(leagueId, List.of(teamId))).thenReturn(true);

        assertThatThrownBy(() -> service.follow(leagueId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void follow_throwsNotFound_whenLeagueMissing() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenThrow(new NotFoundException("League not found"));

        assertThatThrownBy(() -> service.follow(leagueId))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void unfollow_callsDelete() {
        when(currentUserProvider.clerkUserId()).thenReturn(userId);
        when(leagueService.requireActiveLeague(leagueId)).thenReturn(league(LeaguePrivacy.PUBLIC));

        service.unfollow(leagueId);

        verify(leagueFollowRepository).deleteByLeagueIdAndUserId(leagueId, userId);
    }

    private League league(LeaguePrivacy privacy) {
        League l = new League();
        l.setId(leagueId);
        l.setPrivacy(privacy);
        l.setOwnerUserId("other_owner");
        return l;
    }
}
