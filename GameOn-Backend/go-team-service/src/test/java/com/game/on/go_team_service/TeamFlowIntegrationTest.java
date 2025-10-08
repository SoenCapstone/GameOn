package com.game.on.go_team_service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.on.go_team_service.external.UserDirectoryClient;
import com.game.on.go_team_service.team.dto.TeamCreateRequest;
import com.game.on.go_team_service.team.dto.TeamInviteCreateRequest;
import com.game.on.go_team_service.team.dto.TeamUpdateRequest;
import com.game.on.go_team_service.team.model.TeamPrivacy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;


import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TeamFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserDirectoryClient userDirectoryClient;

    @Test
    void fullTeamLifecycle() throws Exception {
        long ownerId = 1001L;
        long playerId = 1002L;
        long emailPlayerId = 1003L;

        when(userDirectoryClient.userExists(anyLong())).thenReturn(true);
        var ownerHeaders = headerBlock(ownerId, null);

        // Create team
        var createRequest = new TeamCreateRequest(
                "Downtown Dragons",
                "basketball",
                null,
                null,
                "Montreal",
                5,
                TeamPrivacy.PRIVATE
        );

        MvcResult createResult = mockMvc.perform(post("/teams")
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Downtown Dragons"))
                .andExpect(jsonPath("$.members[0].role").value("OWNER"))
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResult.getResponse().getContentAsString());
        var teamId = java.util.UUID.fromString(createNode.get("id").asText());
        var slug = createNode.get("slug").asText();

        // Fetch by slug
        mockMvc.perform(get("/teams/" + slug).headers(ownerHeaders))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value(slug));

        // Update team details
        var updateRequest = new TeamUpdateRequest(
                "Downtown Dragons",
                "basketball",
                null,
                null,
                "Montreal QC",
                6,
                TeamPrivacy.PUBLIC
        );

        mockMvc.perform(patch("/teams/" + teamId)
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.privacy").value("PUBLIC"))
                .andExpect(jsonPath("$.maxRoster").value(6));

        // Invite player by userId
        var inviteUserRequest = new TeamInviteCreateRequest(playerId, null, null);
        MvcResult inviteUserResult = mockMvc.perform(post("/teams/" + teamId + "/invites")
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inviteUserRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        var inviteUserId = java.util.UUID.fromString(objectMapper.readTree(inviteUserResult.getResponse()
                .getContentAsString()).get("id").asText());

        // Accept invite as player
        mockMvc.perform(post("/invites/" + inviteUserId + "/accept")
                        .headers(headerBlock(playerId, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PLAYER"));

        // Transfer ownership to player
        var transferPayload = "{\"newOwnerUserId\":" + playerId + "}";
        mockMvc.perform(post("/teams/" + teamId + "/transfer-owner")
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(transferPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ownerUserId").value(playerId))
                .andExpect(jsonPath("$.members[0].role").value("OWNER"));

        // Previous owner demotes to player
        mockMvc.perform(post("/teams/" + teamId + "/members/self-demote")
                        .headers(ownerHeaders))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("PLAYER"));

        var newOwnerHeaders = headerBlock(playerId, null);

        // Invite second player by email
        var inviteEmailRequest = new TeamInviteCreateRequest(null, "player@example.com", null);
        MvcResult inviteEmailResult = mockMvc.perform(post("/teams/" + teamId + "/invites")
                        .headers(newOwnerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inviteEmailRequest)))
                .andExpect(status().isCreated())
                .andReturn();
        var inviteEmailId = UUID.fromString(objectMapper.readTree(inviteEmailResult.getResponse()
                .getContentAsString()).get("id").asText());

        // Accept email invite with matching header
        mockMvc.perform(post("/invites/" + inviteEmailId + "/accept")
                        .headers(headerBlock(emailPlayerId, "player@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(emailPlayerId))
                .andExpect(jsonPath("$.role").value("PLAYER"));

        // List members shows three entries
        MvcResult membersResult = mockMvc.perform(get("/teams/" + teamId + "/members")
                        .headers(newOwnerHeaders))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode members = objectMapper.readTree(membersResult.getResponse().getContentAsString());
        assertThat(members).hasSize(3);

        // Email player leaves their team
        mockMvc.perform(delete("/teams/" + teamId + "/members/" + emailPlayerId)
                        .headers(headerBlock(emailPlayerId, "player@example.com")))
                .andExpect(status().isNoContent());

        // Owner removes the remaining player
        mockMvc.perform(delete("/teams/" + teamId + "/members/" + ownerId)
                        .headers(ownerHeaders))
                .andExpect(status().isNoContent());

        // Archive team
        mockMvc.perform(delete("/teams/" + teamId)
                        .headers(newOwnerHeaders))
                .andExpect(status().isNoContent());

        // Team no longer appears in listings
        MvcResult listResult = mockMvc.perform(get("/teams")
                        .headers(newOwnerHeaders)
                        .param("my", "true"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode listNode = objectMapper.readTree(listResult.getResponse().getContentAsString());
        assertThat(listNode.get("items")).hasSize(0);
        assertThat(listNode.get("totalElements").asInt()).isZero();
    }

    private org.springframework.http.HttpHeaders headerBlock(Long userId, String email) {
        var headers = new org.springframework.http.HttpHeaders();
        headers.add("X-User-Id", Long.toString(userId));
        if (email != null) {
            headers.add("X-User-Email", email);
        }
        return headers;
    }
}
