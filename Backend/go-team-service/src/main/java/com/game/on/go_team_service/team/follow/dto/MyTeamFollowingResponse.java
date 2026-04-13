package com.game.on.go_team_service.team.follow.dto;

import java.util.List;
import java.util.UUID;

public record MyTeamFollowingResponse(List<UUID> teamIds) {
}
