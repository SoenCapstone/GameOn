package com.game.on.go_messaging_service.config;

import com.game.on.go_messaging_service.websocket.GatewayHandshakeHandler;
import com.game.on.go_messaging_service.websocket.SubscriptionAuthorizationInterceptor;
import com.game.on.go_messaging_service.websocket.WebSocketAuthorizationChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final GatewayHandshakeHandler handshakeHandler;
    private final SubscriptionAuthorizationInterceptor subscriptionAuthorizationInterceptor;
    private final WebSocketAuthorizationChannelInterceptor webSocketAuthorizationChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setHandshakeHandler(handshakeHandler)
                .setAllowedOriginPatterns("*");
                // .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthorizationChannelInterceptor, subscriptionAuthorizationInterceptor);
    }
}
