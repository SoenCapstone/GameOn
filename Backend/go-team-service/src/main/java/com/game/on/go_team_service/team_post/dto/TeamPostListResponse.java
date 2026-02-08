package com.game.on.go_team_service.team_post.dto;

import java.util.List;

public record TeamPostListResponse(
        List<TeamPostResponse> posts,
        long totalElements,
        int pageNumber,
        int pageSize,
        boolean hasNext
) {}
