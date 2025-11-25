package com.game.on.go_league_service.league.mapper;

import com.game.on.go_league_service.league.dto.LeagueDetailResponse;
import com.game.on.go_league_service.league.dto.LeagueSeasonResponse;
import com.game.on.go_league_service.league.dto.LeagueSummaryResponse;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueSeason;
import org.springframework.stereotype.Component;

@Component
public class LeagueMapper {

    public LeagueDetailResponse toDetail(League league, long seasonCount) {
        return new LeagueDetailResponse(
                league.getId(),
                league.getName(),
                league.getSport(),
                league.getSlug(),
                league.getLocation(),
                league.getRegion(),
                league.getOwnerUserId(),
                league.getLevel(),
                league.getPrivacy(),
                seasonCount,
                league.getCreatedAt(),
                league.getUpdatedAt(),
                league.getArchivedAt()
        );
    }

    public LeagueSummaryResponse toSummary(League league, long seasonCount) {
        return new LeagueSummaryResponse(
                league.getId(),
                league.getName(),
                league.getSport(),
                league.getSlug(),
                league.getRegion(),
                league.getLevel(),
                league.getPrivacy(),
                seasonCount,
                league.getCreatedAt(),
                league.getUpdatedAt()
        );
    }

    public LeagueSeasonResponse toSeason(LeagueSeason season) {
        return new LeagueSeasonResponse(
                season.getId(),
                season.getLeague().getId(),
                season.getName(),
                season.getStartDate(),
                season.getEndDate(),
                season.getCreatedAt(),
                season.getArchivedAt()
        );
    }
}
