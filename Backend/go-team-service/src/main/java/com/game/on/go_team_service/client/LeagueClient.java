package com.game.on.go_team_service.client;

import com.game.on.go_team_service.client.dto.LeagueMatchDetailsResponse;
import com.game.on.go_team_service.config.FeignAuthForwardingConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "go-league-service",
        configuration = FeignAuthForwardingConfig.class
)
public interface LeagueClient {

    @GetMapping("/api/v1/leagues/matches/{teamId}")
    List<LeagueMatchDetailsResponse> getLeagueMatchesForTeam(@PathVariable UUID teamID);
}
