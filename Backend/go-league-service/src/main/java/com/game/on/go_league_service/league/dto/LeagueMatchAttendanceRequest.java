package com.game.on.go_league_service.league.dto;

import com.game.on.go_league_service.league.model.AttendanceStatus;

public record LeagueMatchAttendanceRequest(
        AttendanceStatus attending
) {
}
