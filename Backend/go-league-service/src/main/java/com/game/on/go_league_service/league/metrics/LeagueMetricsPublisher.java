package com.game.on.go_league_service.league.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class LeagueMetricsPublisher {

    private final Counter leagueCreated;
    private final Counter leagueUpdated;
    private final Counter leagueArchived;
    private final Counter leagueListQuery;

    public LeagueMetricsPublisher(MeterRegistry meterRegistry) {
        this.leagueCreated = meterRegistry.counter("league_created");
        this.leagueUpdated = meterRegistry.counter("league_updated");
        this.leagueArchived = meterRegistry.counter("league_archived");
        this.leagueListQuery = meterRegistry.counter("league_list_query");
    }

    public void leagueCreated() {
        this.leagueCreated.increment();
    }

    public void leagueUpdated() {
        this.leagueUpdated.increment();
    }

    public void leagueArchived() {
        this.leagueArchived.increment();
    }

    public void leagueListQuery() {
        this.leagueListQuery.increment();
    }
}
