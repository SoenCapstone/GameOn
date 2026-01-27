package com.game.on.go_messaging_service.client.dto;

import java.util.List;

public record RemoteTeamListResponse(
        List<RemoteTeamSummary> items
) {
}
