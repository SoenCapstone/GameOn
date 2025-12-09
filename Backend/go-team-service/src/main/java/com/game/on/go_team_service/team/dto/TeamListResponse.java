package com.game.on.go_team_service.team.dto;

import java.util.List;

public record TeamListResponse(
        List<TeamSummaryResponse> items,
        long totalElements,
        int page,
        int size,
        boolean hasNext
) {
}
