package com.game.on.go_team_service.team_announcement.dto;

import java.util.List;

public record TeamAnnouncementListResponse(
        List<TeamAnnouncementResponse> announcements,
        long totalElements,
        int pageNumber,
        int pageSize,
        boolean hasNext
) {}
