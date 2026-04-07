package com.game.on.go_league_service.league.service;

import com.game.on.go_league_service.league.dto.ExploreMatchesRequest;
import com.game.on.go_league_service.league.dto.LeagueMatchResponse;
import com.game.on.go_league_service.league.model.LeagueMatch;
import com.game.on.go_league_service.league.repository.LeagueMatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExploreService {

    private final LeagueMatchRepository leagueMatchRepository;

    @Transactional(readOnly = true)
    public List<LeagueMatchResponse> listUpcomingPublicLeagueMatches(ExploreMatchesRequest request) {
        String sport = StringUtils.hasText(request.sport()) ? request.sport().trim() : null;
        return leagueMatchRepository
                .findUpcomingPublicLeagueMatchesWithinRange(sport, request.latitude(), request.longitude(), request.rangeKm())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private LeagueMatchResponse toResponse(LeagueMatch match) {
        return new LeagueMatchResponse(
                match.getId(),
                match.getLeague().getId(),
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
                match.getCreatedByUserId(),
                match.getCancelledByUserId(),
                match.getCancelReason(),
                match.getCancelledAt(),
                match.getCreatedAt(),
                match.getUpdatedAt()
        );
    }
}
