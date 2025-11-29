package com.game.on.go_team_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.on.go_team_service.team.dto.TeamCreateRequest;
import com.game.on.go_team_service.team.model.TeamPrivacy;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TeamFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createTeam_success() throws Exception {
        long ownerId = 123L;

        HttpHeaders headers = headerBlock(ownerId, "owner@example.com");

        // Matches *exactly* your current TeamCreateRequest:
        // (name, sport, scope, logoUrl, location, privacy)
        TeamCreateRequest request = new TeamCreateRequest(
                "Montreal Ballers",                 // name
                "basketball",                       // sport
                "casual",                           // scope
                "https://example.com/logo.png",     // logoUrl
                "mtl",                              // location (city code)
                TeamPrivacy.PUBLIC                  // privacy
        );

        mockMvc.perform(post("/api/v1/teams")
                        .headers(headers)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Montreal Ballers"))
                .andExpect(jsonPath("$.sport").value("basketball"))
                .andExpect(jsonPath("$.scope").value("casual"))
                .andExpect(jsonPath("$.location").value("mtl"))
                .andExpect(jsonPath("$.privacy").value("PUBLIC"));
    }

    private HttpHeaders headerBlock(Long userId, String email) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-User-Id", Long.toString(userId));
        if (email != null) {
            headers.add("X-User-Email", email);
        }
        return headers;
    }
}
