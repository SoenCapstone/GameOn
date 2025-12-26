package com.game.on.go_messaging_service.client;

import com.game.on.go_messaging_service.client.dto.RemoteTeamDetail;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "go-team-service", path = "/api/v1/teams")
public interface TeamDirectoryClient {

    @GetMapping("/{teamId}")
    RemoteTeamDetail fetchTeam(@PathVariable("teamId") UUID teamId);
}
