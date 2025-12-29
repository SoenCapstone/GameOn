package com.game.on.go_league_service.league.mapper;

import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueDetailResponse;
import com.game.on.go_league_service.league.dto.LeagueInviteRespondRequest;
import com.game.on.go_league_service.league.dto.LeagueSeasonResponse;
import com.game.on.go_league_service.league.dto.LeagueSummaryResponse;
import com.game.on.go_league_service.league.model.League;
import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.model.LeagueInvite;
import com.game.on.go_league_service.league.model.LeagueSeason;
import com.game.on.go_league_service.league.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import static org.apache.commons.lang.StringUtils.trimToNull;

@Component
@RequiredArgsConstructor
public class LeagueMapper {

    private final SlugGenerator slugGenerator;

    public League toLeague(LeagueCreateRequest request, String ownerUserId) {
        return League.builder()
                .name(request.name().trim())
                .sport(trimToNull(request.sport()))
                .slug(slugGenerator.generateUniqueSlug(request.name()))
                .location(trimToNull(request.location()))
                .region(trimToNull(request.region()))
                .ownerUserId(ownerUserId)
                .level(request.level() == null ? LeagueLevel.COMPETITIVE: request.level())
                .privacy(request.privacy() == null ? LeaguePrivacy.PUBLIC: request.privacy())
                .seasonCount(0)
                .build();
    }

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

    public LeagueInviteRespondRequest toResponse(LeagueInvite invite) {
    return new LeagueInviteRespondRequest(
            invite.getId(),
            invite.getLeagueId(),
            String.valueOf(invite.getInvitedByUserId()),
            invite.getInviteeUserId() != null ? invite.getInviteeUserId().toString() : null,
            invite.getInviteeEmail(),
            invite.getStatus(),
            invite.getRole(),
            invite.getCreatedAt(),
            invite.getUpdatedAt(),
            invite.getExpiresAt(),
            invite.getRespondedAt()
    );
}


}
