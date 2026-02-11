package com.game.on.go_league_service.league;

import com.game.on.go_league_service.client.TeamClient;
import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.league.dto.RefInviteRequest;
import com.game.on.go_league_service.league.model.LeagueMatch;
import com.game.on.go_league_service.league.model.RefInvite;
import com.game.on.go_league_service.league.model.RefInviteStatus;
import com.game.on.go_league_service.league.repository.LeagueMatchRepository;
import com.game.on.go_league_service.league.repository.RefInviteRepository;
import com.game.on.go_league_service.league.repository.RefereeProfileRepository;
import com.game.on.go_league_service.league.service.RefereeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefereeServiceTest {

    @Mock RefereeProfileRepository refereeProfileRepository;
    @Mock RefInviteRepository refInviteRepository;
    @Mock LeagueMatchRepository leagueMatchRepository;
    @Mock TeamClient teamClient;
    @Mock CurrentUserProvider userProvider;

    @InjectMocks
    RefereeService refereeService;

    private final UUID matchId = UUID.randomUUID();

    @BeforeEach
    void setup() {
        when(userProvider.clerkUserId()).thenReturn("ref_1");
    }

    @Test
    void createRefInvite_whenLeagueMatch_throwsBadRequest() {
        when(leagueMatchRepository.findById(matchId)).thenReturn(Optional.of(new LeagueMatch()));

        RefInviteRequest request = new RefInviteRequest("ref_1");

        assertThrows(BadRequestException.class, () -> refereeService.createRefInvite(matchId, request));
        verify(refInviteRepository, never()).save(any());
    }

    @Test
    void acceptRefInvite_assignsRefereeAndMarksAccepted() {
        when(leagueMatchRepository.findById(matchId)).thenReturn(Optional.empty());

        RefInvite invite = new RefInvite();
        invite.setId(UUID.randomUUID());
        invite.setMatchId(matchId);
        invite.setRefereeUserId("ref_1");
        invite.setStatus(RefInviteStatus.PENDING);

        when(refInviteRepository.findByMatchIdAndRefereeUserIdAndStatus(matchId, "ref_1", RefInviteStatus.PENDING))
                .thenReturn(Optional.of(invite));

        refereeService.acceptRefInvite(matchId);

        verify(teamClient).assignReferee(matchId);
        verify(refInviteRepository).save(invite);
        assertEquals(RefInviteStatus.ACCEPTED, invite.getStatus());
    }
}
