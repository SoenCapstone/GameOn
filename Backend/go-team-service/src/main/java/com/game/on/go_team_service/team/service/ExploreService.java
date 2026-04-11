package com.game.on.go_team_service.team.service;

import com.game.on.go_team_service.team.dto.ExploreMatchesRequest;
import com.game.on.go_team_service.team.dto.TeamMatchResponse;
import com.game.on.go_team_service.team.model.TeamMatch;
import com.game.on.go_team_service.team.repository.TeamMatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExploreService {

    private final TeamMatchRepository teamMatchRepository;

    @Transactional(readOnly = true)
    public List<TeamMatchResponse> listUpcomingPublicTeamMatches(ExploreMatchesRequest request) {
        String sport = StringUtils.hasText(request.sport()) ? request.sport().trim() : null;
        return teamMatchRepository
                .findUpcomingPublicTeamMatchesWithinRange(sport, request.latitude(), request.longitude(), request.rangeKm())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private TeamMatchResponse toResponse(TeamMatch match) {
        return new TeamMatchResponse(
                match.getId(),
                match.getMatchType(),
                match.getStatus(),
                match.getHomeTeamId(),
                match.getAwayTeamId(),
                null,
                null,
                match.getSport(),
                match.getStartTime(),
                match.getEndTime(),
                match.getScheduledDate(),
                match.getMatchLocation(),
                match.getVenueId(),
                match.isRequiresReferee(),
                match.getRefereeUserId(),
                match.getNotes(),
                match.getCreatedByUserId(),
                match.getCancelledByUserId(),
                match.getCancelReason(),
                match.getCancelledAt(),
                match.getCreatedAt(),
                match.getUpdatedAt()
        );
    }
}
