package com.game.on.go_team_service.team.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class TeamMetricsPublisher {

    private final Counter teamCreated;
    private final Counter teamArchived;
    private final Counter inviteSent;
    private final Counter inviteAccepted;
    private final Counter inviteDeclined;
    private final Counter ownershipTransferred;

    public TeamMetricsPublisher(MeterRegistry meterRegistry) {
        this.teamCreated = meterRegistry.counter("team_created");
        this.teamArchived = meterRegistry.counter("team_archived");
        this.inviteSent = meterRegistry.counter("team_invite_sent");
        this.inviteAccepted = meterRegistry.counter("team_invite_accepted");
        this.inviteDeclined = meterRegistry.counter("team_invite_declined");
        this.ownershipTransferred = meterRegistry.counter("team_owner_transferred");
    }

    public void teamCreated() {
        this.teamCreated.increment();
    }

    public void teamArchived() {
        this.teamArchived.increment();
    }

    public void inviteSent() {
        this.inviteSent.increment();
    }

    public void inviteAccepted() {
        this.inviteAccepted.increment();
    }

    public void inviteDeclined() {
        this.inviteDeclined.increment();
    }

    public void ownershipTransferred() {
        this.ownershipTransferred.increment();
    }
}
