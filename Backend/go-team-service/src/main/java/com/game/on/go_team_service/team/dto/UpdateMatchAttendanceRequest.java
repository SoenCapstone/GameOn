package com.game.on.go_team_service.team.dto;

import com.game.on.go_team_service.team.model.AttendanceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateMatchAttendanceRequest(
        @NotNull (message = "Attendance cannot be null")
        AttendanceStatus attending
) {
}
