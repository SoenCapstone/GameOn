package com.game.on.go_api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.mockito.Mockito;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

@SpringBootTest
class GoApiGatewayApplicationTests {

	@TestConfiguration
	static class TestConfig {
		@Bean
		public ReactiveJwtDecoder jwtDecoder() {
			return Mockito.mock(ReactiveJwtDecoder.class);
		}
	}

	@Test
	void contextLoads() {
	}

}
