package com.game.on.go_league_service.league;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.game.on.go_league_service.league.dto.LeagueCreateRequest;
import com.game.on.go_league_service.league.dto.LeagueUpdateRequest;
import com.game.on.go_league_service.league.model.LeagueLevel;
import com.game.on.go_league_service.league.model.LeaguePrivacy;
import com.game.on.go_league_service.league.model.LeagueSeason;
import com.game.on.go_league_service.league.repository.LeagueRepository;
import com.game.on.go_league_service.league.repository.LeagueSeasonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LeagueControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LeagueRepository leagueRepository;

    @Autowired
    private LeagueSeasonRepository leagueSeasonRepository;

    @Test
    void leagueCrudFlow() throws Exception {
        var ownerHeaders = headers(500L);
        var createRequest = new LeagueCreateRequest(
                "Metro Premier League",
                "soccer",
                "quebec",
                "Montreal",
                LeagueLevel.COMPETITIVE,
                LeaguePrivacy.PUBLIC
        );

        var createResponse = mockMvc.perform(post("/api/v1/leagues")
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Metro Premier League"))
                .andReturn();

        JsonNode createNode = objectMapper.readTree(createResponse.getResponse().getContentAsString());
        UUID leagueId = UUID.fromString(createNode.get("id").asText());
        String slug = createNode.get("slug").asText();

        mockMvc.perform(get("/api/v1/leagues/" + slug).headers(ownerHeaders))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value(slug));

        mockMvc.perform(get("/api/v1/leagues")
                        .headers(ownerHeaders)
                        .param("my", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].name").value("Metro Premier League"));

        var league = leagueRepository.findById(leagueId).orElseThrow();
        leagueSeasonRepository.save(LeagueSeason.builder()
                .league(league)
                .name("Fall 2024")
                .startDate(LocalDate.of(2024, 9, 1))
                .endDate(LocalDate.of(2024, 12, 1))
                .build());
        leagueSeasonRepository.save(LeagueSeason.builder()
                .league(league)
                .name("Winter 2025")
                .startDate(LocalDate.of(2025, 1, 10))
                .endDate(LocalDate.of(2025, 3, 20))
                .build());

        var seasonsResponse = mockMvc.perform(get("/api/v1/leagues/" + leagueId + "/seasons")
                        .headers(ownerHeaders))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode seasons = objectMapper.readTree(seasonsResponse.getResponse().getContentAsString());
        assertThat(seasons).hasSize(2);

        var updateRequest = new LeagueUpdateRequest(
                null,
                null,
                "ontario",
                "Toronto",
                null,
                LeaguePrivacy.PRIVATE
        );

        mockMvc.perform(patch("/api/v1/leagues/" + leagueId)
                        .headers(ownerHeaders)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.privacy").value("PRIVATE"))
                .andExpect(jsonPath("$.region").value("ontario"));

        mockMvc.perform(get("/api/v1/leagues/" + slug)
                        .headers(headers(999L)))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/leagues/" + leagueId).headers(ownerHeaders))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/leagues")
                        .headers(ownerHeaders)
                        .param("my", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(get("/api/v1/leagues/" + leagueId + "/seasons")
                        .headers(ownerHeaders))
                .andExpect(status().isNotFound());
    }

    private HttpHeaders headers(Long userId) {
        var headers = new HttpHeaders();
        headers.add("X-User-Id", Long.toString(userId));
        headers.add("X-User-Email", userId + "@example.com");
        return headers;
    }
}
