package com.game.on.go_team_service.external;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
@RequiredArgsConstructor
public class RestUserDirectoryClient implements UserDirectoryClient {

    private final RestClient userServiceRestClient;

    @Override
    public boolean userExists(Long userId) {
        try {
            userServiceRestClient.get()
                    .uri("/api/v1/user/id/{userId}", userId)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                return false;
            }
            throw ex;
        }
    }
}
