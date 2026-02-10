package com.game.on.go_league_service.client;

import com.game.on.go_league_service.client.dto.TeamListResponse;
import com.game.on.go_league_service.client.dto.TeamMatchDetailResponse;
import com.game.on.go_league_service.client.dto.TeamMembershipResponse;
import com.game.on.go_league_service.client.dto.TeamSummaryResponse;
import com.game.on.go_league_service.config.FeignAuthForwardingConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(
        name = "go-team-service",
        configuration = FeignAuthForwardingConfig.class
)
public interface TeamClient {

    @GetMapping("/api/v1/teams/{teamId}")
    TeamSummaryResponse getTeam(@PathVariable UUID teamId);

    @GetMapping("/api/v1/teams/{teamId}/memberships/me")
    TeamMembershipResponse getMyMembership(@PathVariable UUID teamId);

    @GetMapping("/api/v1/teams")
    TeamListResponse listTeams(@RequestParam("my") boolean onlyMine);

    @GetMapping("/api/v1/teams/{teamId}/members/{userId}/exists")
    Boolean isMember(@PathVariable UUID teamId, @PathVariable String userId);

    @GetMapping("/api/v1/matches/{matchId}")
    TeamMatchDetailResponse getTeamMatch(@PathVariable UUID matchId);

    @PostMapping("/api/v1/matches/{matchId}/assign-referee")
    void assignReferee(@PathVariable UUID matchId);
}
