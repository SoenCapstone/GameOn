package com.game.on.go_team_service.team_announcement.mapper;

import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementCreateRequest;
import com.game.on.go_team_service.team_announcement.dto.TeamAnnouncementResponse;
import com.game.on.go_team_service.team_announcement.model.TeamAnnouncement;
import com.game.on.go_team_service.team_announcement.model.TeamAnnouncementScope;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TeamAnnouncementMapper {

    public TeamAnnouncement toTeamAnnouncement(UUID teamId, TeamAnnouncementCreateRequest request, String userId) {
        return TeamAnnouncement.builder()
                .teamId(teamId)
                .authorUserId(userId)
                .title(request.title())
                .content(request.content())
                .scope(TeamAnnouncementScope.MEMBERS_ONLY)
                .build();
    }

    public TeamAnnouncementResponse toResponse(TeamAnnouncement a) {
        return new TeamAnnouncementResponse(
                a.getId(),
                a.getTeamId(),
                a.getAuthorUserId(),
                a.getTitle(),
                a.getContent(),
                a.getScope(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
