package com.game.on.go_messaging_service.client;

import com.game.on.go_messaging_service.client.dto.RemoteTeamMember;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record TeamSnapshot(UUID teamId,
                           String ownerUserId,
                           List<RemoteTeamMember> activeMembers) {

    public boolean isOwner(String userId) {
        return ownerUserId != null && ownerUserId.equals(userId);
    }

    public boolean isActiveMember(String userId) {
        return activeMembers.stream().anyMatch(member -> member.userId().equals(userId));
    }

    public Set<String> activeMemberIds() {
        return activeMembers.stream()
                .map(RemoteTeamMember::userId)
                .collect(Collectors.toSet());
    }
}
