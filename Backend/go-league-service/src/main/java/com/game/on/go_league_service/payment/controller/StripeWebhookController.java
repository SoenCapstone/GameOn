package com.game.on.go_league_service.payment.controller;

import com.game.on.go_league_service.exception.ErrorResponse;
import com.game.on.go_league_service.payment.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class StripeWebhookController {

    private final StripeWebhookService stripeWebhookService;

    /**
     * Stripe calls this endpoint. Do NOT protect it with Clerk auth.
     * Verifies signature using STRIPE_WEBHOOK_SECRET.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Object> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        try {
            Event event = stripeWebhookService.verifyAndConstructEvent(payload, sigHeader);
            log.info("stripe_webhook_received type={} id={}", event.getType(), event.getId());

            stripeWebhookService.handleEvent(event);

            return ResponseEntity.ok().build();
        } catch (SignatureVerificationException e) {
            log.warn("stripe_webhook_signature_verification_failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ErrorResponse.of(HttpStatus.BAD_REQUEST.name(), "Invalid webhook signature"));
        } catch (Exception e) {
            log.error("stripe_webhook_error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.name(), "Webhook handler error"));
        }
    }
}
