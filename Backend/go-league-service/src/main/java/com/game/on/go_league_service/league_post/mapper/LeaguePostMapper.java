package com.game.on.go_league_service.league_post.mapper;

import com.game.on.go_league_service.league_post.dto.LeaguePostCreateRequest;
import com.game.on.go_league_service.league_post.dto.LeaguePostResponse;
import com.game.on.go_league_service.league_post.model.LeaguePost;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class LeaguePostMapper {

    public LeaguePost toLeaguePost(UUID leagueId, LeaguePostCreateRequest request, String authorUserId) {
        return LeaguePost.builder()
                .leagueId(leagueId)
                .authorUserId(authorUserId)
                .title(trimToNull(request.title()))
                .body(request.body().trim())
                .scope(request.scope())
                .build();
    }

    public LeaguePostResponse toResponse(LeaguePost post) {
        return new LeaguePostResponse(
                post.getId(),
                post.getLeagueId(),
                post.getAuthorUserId(),
                post.getTitle(),
                post.getBody(),
                post.getScope(),
                post.getCreatedAt()
        );
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        var t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
