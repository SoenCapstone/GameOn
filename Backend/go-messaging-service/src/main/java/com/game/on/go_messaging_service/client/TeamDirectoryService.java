package com.game.on.go_messaging_service.client;

import com.game.on.go_messaging_service.client.dto.RemoteTeamDetail;
import com.game.on.go_messaging_service.client.dto.RemoteTeamListResponse;
import com.game.on.go_messaging_service.client.dto.RemoteTeamSummary;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMember;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMemberStatus;
import com.game.on.go_messaging_service.exception.NotFoundException;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamDirectoryService {

    private final TeamDirectoryClient teamDirectoryClient;
    private static final int TEAM_LIST_PAGE_SIZE = 50;

    public TeamSnapshot fetchSnapshot(UUID teamId) {
        try {
            RemoteTeamDetail detail = teamDirectoryClient.fetchTeam(teamId);
            List<RemoteTeamMember> members = teamDirectoryClient.fetchMembers(teamId);
            List<RemoteTeamMember> activeMembers = members == null
                    ? List.of()
                    : members.stream()
                    .filter(member -> member != null && member.userId() != null)
                    .filter(member -> member.status() == RemoteTeamMemberStatus.ACTIVE)
                    .toList();
            return new TeamSnapshot(detail.id(), detail.ownerUserId(), List.copyOf(activeMembers));
        } catch (FeignException.NotFound ex) {
            throw new NotFoundException("Team not found");
        } catch (FeignException ex) {
            log.error("team_lookup_failed teamId={}", teamId, ex);
            throw new NotFoundException("Unable to verify team information");
        }
    }

    public List<UUID> fetchActiveTeamIdsForUser() {
        try {
            RemoteTeamListResponse response = teamDirectoryClient.listTeams(true, 0, TEAM_LIST_PAGE_SIZE);
            List<RemoteTeamSummary> items = response == null ? List.of() : response.items();
            if (items == null || items.isEmpty()) {
                return List.of();
            }
            return items.stream()
                    .map(RemoteTeamSummary::id)
                    .filter(id -> id != null)
                    .collect(Collectors.toList());
        } catch (FeignException ex) {
            log.error("team_list_failed", ex);
            return List.of();
        }
    }
}
