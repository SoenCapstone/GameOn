package com.game.on.go_team_service.team.mapper;

import com.game.on.go_team_service.team.dto.*;
import com.game.on.go_team_service.team.model.*;
import com.game.on.go_team_service.team.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.apache.commons.lang.StringUtils.trimToNull;

@Component
@RequiredArgsConstructor
public class TeamMapper {
    private final SlugGenerator slugGenerator;
    private static final int DEFAULT_INVITE_EXPIRY_DAYS = 7;

    public Team toTeam(TeamCreateRequest request, String ownerUserId) {
        return Team.builder()
                .name(request.name().trim())
                .sport(trimToNull(request.sport()))
//                .leagueId(request.leagueId())
                .scope(trimToNull(request.scope()))
                .ownerUserId(ownerUserId)
                .slug(slugGenerator.generateUniqueSlug(request.name()))
                .logoUrl(trimToNull(request.logoUrl()))
                .location(trimToNull(request.location()))
                .allowedRegions(normalizeRegions(request.allowedRegions()))
                .privacy(request.privacy() == null ? TeamPrivacy.PUBLIC : request.privacy())
                .build();
    }

    public TeamMember toTeamMember(Team team, String userId, TeamRole role){
        return TeamMember.builder()
                .team(team)
                .userId(userId)
                .role(role)
                .status(TeamMemberStatus.ACTIVE)
                .build();
    }

    public TeamInvite toTeamInvite(Team team, String userId, String inviteeUserId, String inviteeEmail, TeamRole role, OffsetDateTime expiresAt){
        return TeamInvite.builder()
                .team(team)
                .invitedByUserId(userId)
                .inviteeUserId(inviteeUserId)
                .inviteeEmail(inviteeEmail)
                .role(role)
                .status(TeamInviteStatus.PENDING)
                .expiresAt(expiresAt == null ? OffsetDateTime.now().plusDays(DEFAULT_INVITE_EXPIRY_DAYS) : expiresAt)
                .build();
    }

    public TeamDetailResponse toDetail(Team team) {
        return new TeamDetailResponse(
                team.getId(),
                team.getName(),
                team.getSport(),
//                team.getLeagueId(),
                team.getScope(),
                team.getOwnerUserId(),
                team.getSlug(),
                team.getLogoUrl(),
                team.getLocation(),
                new ArrayList<>(team.getAllowedRegions()),
//                team.getMaxRoster(),
                team.getPrivacy(),
                team.isArchived(),
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }

    public TeamSummaryResponse toSummary(Team team) {
        return new TeamSummaryResponse(
                team.getId(),
                team.getName(),
                team.getSport(),
//                team.getLeagueId(),
                team.getSlug(),
                team.getLogoUrl(),
                team.getPrivacy(),
//                team.getMaxRoster(),
                team.isArchived(),
                team.getCreatedAt(),
                team.getUpdatedAt()
        );
    }

    public TeamMemberResponse toMember(TeamMember member) {
        return new TeamMemberResponse(
                member.getUserId(),
                member.getRole(),
                member.getStatus(),
                member.getJoinedAt()
        );
    }

    public TeamInviteResponse toInviteResponse(TeamInvite invite) {
        return new TeamInviteResponse(
                invite.getId(),
                invite.getTeam().getId(),
                invite.getInvitedByUserId(),
                invite.getInviteeUserId(),
                invite.getInviteeEmail(),
                invite.getStatus(),
                invite.getRole(),
                invite.getCreatedAt(),
                invite.getUpdatedAt(),
                invite.getExpiresAt(),
                invite.getRespondedAt()
        );
    }

    private List<String> normalizeRegions(List<String> regions) {
        if (regions == null) {
            return new ArrayList<>();
        }
        return regions.stream()
                .map(region -> region == null ? null : region.trim())
                .filter(region -> region != null && !region.isBlank())
                .distinct()
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }
}
