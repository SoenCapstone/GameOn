package com.game.on.go_league_service.payment.controller;

import com.game.on.go_league_service.payment.dto.CreatePaymentIntentRequest;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentResponse;
import com.game.on.go_league_service.payment.dto.PaymentResponse;
import com.game.on.go_league_service.payment.service.PaymentQueryService;
import com.game.on.go_league_service.payment.service.StripePaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StripePaymentService stripePaymentService;
    private final PaymentQueryService paymentQueryService;

    @PostMapping("/intent")
    public ResponseEntity<CreatePaymentIntentResponse> createPaymentIntent( @Valid @RequestBody CreatePaymentIntentRequest request) {

        log.info("create_payment_intent_request leagueId={} amount={} currency={}", request.leagueId(), request.amount(), request.currency());

        return ResponseEntity.status(HttpStatus.CREATED).body(stripePaymentService.createPaymentIntent(request));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID paymentId) {
        PaymentResponse response = paymentQueryService.getPayment(paymentId);
        return ResponseEntity.ok(response);
    }
}
