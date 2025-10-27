package com.game.on.go_user_service.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.*;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
/**
 * Configuration class that enables Feign clients to call Keycloak using
 * the client-credentials flow.
 *
 * <p>This class automatically retrieves an access token from Keycloak
 * on behalf of the service (not a user) and attaches it as a
 * {@code Bearer} token to all outgoing Feign requests that use this configuration.</p>
 *
 * <p>It is used for internal service-to-Keycloak communication — for example,
 * when creating, updating, or deleting users via the Keycloak Admin API.
 * Regular user-to-service authentication is still handled separately by
 * {@link com.game.on.go_user_service.config.SecurityConfig} and
 * {@link com.game.on.go_user_service.config.FeignClientConfig}.</p>
 *
 */
@Configuration
public class KeycloakFeignOAuth2Config {

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository registrations,
            OAuth2AuthorizedClientService clients) {

        var provider = OAuth2AuthorizedClientProviderBuilder.builder()
                .clientCredentials()
                .build();

        var manager = new AuthorizedClientServiceOAuth2AuthorizedClientManager(registrations, clients);
        manager.setAuthorizedClientProvider(provider);
        return manager;
    }

    @Bean
    public RequestInterceptor keycloakClientCredentialsInterceptor(OAuth2AuthorizedClientManager manager) {
        return template -> {
            var req = OAuth2AuthorizeRequest.withClientRegistrationId("keycloak-admin")
                    .principal("system")
                    .build();
            var client = manager.authorize(req);
            if (client == null) throw new IllegalStateException("Failed to obtain Keycloak token");
            template.header("Authorization", "Bearer " + client.getAccessToken().getTokenValue());
        };
    }
}
