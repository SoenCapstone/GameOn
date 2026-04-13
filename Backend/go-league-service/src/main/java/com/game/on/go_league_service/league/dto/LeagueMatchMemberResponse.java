package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.AttendanceStatus;

import java.util.UUID;


public record LeagueMatchMemberResponse(
        UUID id,
        UUID teamId,
        String userId,
        String role,
        AttendanceStatus status
) {
}
