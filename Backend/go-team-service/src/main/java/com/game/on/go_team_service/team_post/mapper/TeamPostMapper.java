package com.game.on.go_team_service.team_post.mapper;

import com.game.on.go_team_service.team_post.dto.TeamPostCreateRequest;
import com.game.on.go_team_service.team_post.dto.TeamPostResponse;
import com.game.on.go_team_service.team_post.model.TeamPost;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TeamPostMapper {

    public TeamPost toTeamPost(UUID teamId, TeamPostCreateRequest request, String authorUserId, String authorRole) {
        return TeamPost.builder()
                .teamId(teamId)
                .authorUserId(authorUserId)
                .authorRole(authorRole)
                .title(request.title())
                .body(request.body())
                .scope(request.scope())
                .build();
    }

    public TeamPostResponse toResponse(TeamPost post) {
        return new TeamPostResponse(
                post.getId(),
                post.getTeamId(),
                post.getAuthorUserId(),
                post.getAuthorRole(),
                post.getTitle(),
                post.getBody(),
                post.getScope(),
                post.getCreatedAt()
        );
    }
}
