package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.AttendanceStatus;

public record UpdateMatchAttendanceRequest(
        AttendanceStatus attending
) {
}
