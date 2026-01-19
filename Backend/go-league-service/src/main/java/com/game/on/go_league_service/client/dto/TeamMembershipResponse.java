package com.game.on.go_league_service.client.dto;

public record TeamMembershipResponse(
        String userId,
        String role,
        String status
) {
}
