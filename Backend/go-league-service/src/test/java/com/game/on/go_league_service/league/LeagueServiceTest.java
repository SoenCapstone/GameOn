package com.game.on.go_league_service.league;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueSearchCriteria;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.mapper.LeagueMapper;
import com.game.on.go_league_service.league.metrics.LeagueMetricsPublisher;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository;
import com.game.on.go_league_service.league.repository.LeagueInviteRepository;
import com.game.on.go_league_service.league.repository.LeagueInviteRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private LeagueInviteRepository leagueInviteRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private SlugGenerator slugGenerator;

    private LeagueService leagueService;

    @BeforeEach
    void setUp() {
        LeagueMapper mapper = new LeagueMapper(slugGenerator);
        leagueService = new LeagueService(
                leagueRepository,
                leagueSeasonRepository,
                mapper,
                currentUserProvider,
                metricsPublisher, 
                leagueInviteRepository);
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
                "basketball",
                "Quebec",
                "Montreal",
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

        LeagueCreateRequest request =
                new LeagueCreateRequest("!!!", "soccer", null, null, null, null);

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
                        new LeagueUpdateRequest(null, null, null, null, null, null)
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
                        new LeagueUpdateRequest("New", null, null, null, null, null)
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
}
