package com.game.on.go_league_service.league;

import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.mapper.LeagueMapper;
import com.game.on.go_league_service.league.metrics.LeagueMetricsPublisher;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.repository.LeagueMemberRepository;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository;
import com.game.on.go_league_service.league.repository.LeagueInviteRepository;
import com.game.on.go_league_service.league.service.LeagueService;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeagueServiceTest {

    @Mock
    private LeagueRepository leagueRepository;

    @Mock
    private LeagueSeasonRepository leagueSeasonRepository;

    @Mock
    private LeagueMetricsPublisher metricsPublisher;

    @Mock
    private LeagueInviteRepository leagueInviteRepository;

    @Mock
    private LeagueMemberRepository leagueMemberRepository;

    private LeagueService leagueService;

    @BeforeEach
    void setUp() {
        leagueService = new LeagueService(leagueRepository, leagueSeasonRepository, new LeagueMapper(), metricsPublisher, leagueInviteRepository, leagueMemberRepository);
    }

    @Test
    void createLeagueGeneratesSlugAndDefaultsPrivacy() {
        when(leagueRepository.existsBySlug(any())).thenReturn(false);
        when(leagueRepository.save(any())).thenAnswer(invocation -> {
            League league = invocation.getArgument(0);
            league.setId(UUID.randomUUID());
            league.setCreatedAt(OffsetDateTime.now());
            league.setUpdatedAt(OffsetDateTime.now());
            return league;
        });
        doNothing().when(metricsPublisher).leagueCreated();

        var request = new LeagueCreateRequest("Downtown League", "Basketball", "Quebec", "Montreal", null, null);
        var response = leagueService.createLeague(request, 55L);

        assertThat(response.slug()).isEqualTo("downtown-league");
        assertThat(response.privacy()).isEqualTo(LeaguePrivacy.PUBLIC);
        assertThat(response.ownerUserId()).isEqualTo(55L);
        verify(metricsPublisher).leagueCreated();
    }

    @Test
    void updateLeagueAppliesChanges() {
        var leagueId = UUID.randomUUID();
        var league = League.builder()
                .id(leagueId)
                .name("Old Name")
                .sport("soccer")
                .slug("old-name")
                .ownerUserId(77L)
                .privacy(LeaguePrivacy.PUBLIC)
                .seasonCount(0)
                .build();
        league.setCreatedAt(OffsetDateTime.now().minusDays(1));
        league.setUpdatedAt(OffsetDateTime.now().minusDays(1));

        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));
        when(leagueRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(leagueSeasonRepository.countByLeague_IdAndArchivedAtIsNull(leagueId)).thenReturn(2L);

        var update = new LeagueUpdateRequest("New Name", "volleyball", "Ontario", "Toronto", LeagueLevel.COMPETITIVE, LeaguePrivacy.PRIVATE);
        var response = leagueService.updateLeague(leagueId, update, 77L);

        assertThat(response.name()).isEqualTo("New Name");
        assertThat(response.sport()).isEqualTo("volleyball");
        assertThat(response.region()).isEqualTo("Ontario");
        assertThat(response.privacy()).isEqualTo(LeaguePrivacy.PRIVATE);
        assertThat(response.seasonCount()).isEqualTo(2L);
        verify(metricsPublisher).leagueUpdated();
    }

    @Test
    void updateLeagueRejectsNonOwners() {
        var leagueId = UUID.randomUUID();
        var league = League.builder()
                .id(leagueId)
                .name("Old")
                .sport("soccer")
                .slug("old")
                .ownerUserId(1L)
                .privacy(LeaguePrivacy.PRIVATE)
                .seasonCount(0)
                .build();
        when(leagueRepository.findByIdAndArchivedAtIsNull(leagueId)).thenReturn(Optional.of(league));

        assertThatThrownBy(() -> leagueService.updateLeague(leagueId,
                new LeagueUpdateRequest("New", null, null, null, null, null), 99L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void listLeaguesReturnsSeasonCounts() {
        var league = League.builder()
                .id(UUID.randomUUID())
                .name("Metro League")
                .sport("soccer")
                .slug("metro-league")
                .region("quebec")
                .ownerUserId(50L)
                .privacy(LeaguePrivacy.PUBLIC)
                .seasonCount(0)
                .build();
        league.setCreatedAt(OffsetDateTime.now());
        league.setUpdatedAt(OffsetDateTime.now());

        when(leagueRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenAnswer(invocation -> new PageImpl<>(List.of(league), PageRequest.of(0, 20), 1));
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

        var response = leagueService.listLeagues(new LeagueSearchCriteria(false, null, null, null), 0, 20, 50L);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).seasonCount()).isEqualTo(3);
        verify(metricsPublisher).leagueListQuery();
    }

    @Test
    void createLeagueRejectsInvalidSlug() {
        when(leagueRepository.existsBySlug(any())).thenReturn(false);
        var request = new LeagueCreateRequest("!!!", "Soccer", null, null, null, null);

        assertThatThrownBy(() -> leagueService.createLeague(request, 1L))
                .isInstanceOf(BadRequestException.class);
    }
}
