package com.game.on.go_messaging_service.client;

import com.game.on.go_messaging_service.client.dto.RemoteTeamDetail;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMember;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMemberStatus;
import com.game.on.go_messaging_service.exception.NotFoundException;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamDirectoryService {

    private final TeamDirectoryClient teamDirectoryClient;

    public TeamSnapshot fetchSnapshot(UUID teamId) {
        try {
            RemoteTeamDetail detail = teamDirectoryClient.fetchTeam(teamId);
            List<RemoteTeamMember> activeMembers = detail.members() == null
                    ? List.of()
                    : detail.members().stream()
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
}
