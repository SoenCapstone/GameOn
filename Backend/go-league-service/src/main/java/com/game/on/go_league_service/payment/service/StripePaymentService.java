package com.game.on.go_league_service.payment.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentRequest;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentResponse;
import com.game.on.go_league_service.payment.mapper.PaymentMapper;
import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.model.PaymentStatus;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripePaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final CurrentUserProvider userProvider;

    public CreatePaymentIntentResponse createPaymentIntent(CreatePaymentIntentRequest req) {
        String userId = userProvider.clerkUserId();

        Payment payment = paymentMapper.toPayment(req, userId);
        Payment savedPayment = paymentRepository.save(payment);

        try {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("paymentId", savedPayment.getId().toString());
            metadata.put("userId", userId);
            if (req.leagueId() != null) {
                metadata.put("leagueId", req.leagueId().toString());
            }
            if (req.teamId() != null) {
                metadata.put("teamId", req.teamId().toString());
            }


            PaymentIntentCreateParams.Builder paramsBuilder = PaymentIntentCreateParams.builder()
                    .setAmount(req.amount())
                    .setCurrency(req.currency().toLowerCase())
                    .putAllMetadata(metadata)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .setAllowRedirects(PaymentIntentCreateParams.AutomaticPaymentMethods.AllowRedirects.NEVER)
                                    .build()
                    );

            log.info(
                    "Stripe.apiKey present right before create? {}",
                    (Stripe.apiKey != null && !Stripe.apiKey.isBlank())
            );

            if (req.description() != null && !req.description().isBlank()) {
                paramsBuilder.setDescription(req.description());
            }

            PaymentIntent intent = PaymentIntent.create(paramsBuilder.build());

            savedPayment.setStripePaymentIntentId(intent.getId());
            Payment finalSaved = paymentRepository.save(savedPayment);

            return paymentMapper.toPaymentIntentResponse(finalSaved, intent);

        } catch (StripeException e) {
            savedPayment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(savedPayment);
            log.error(
                    "Stripe PaymentIntent.create failed: status={} code={} message={}",
                    e.getStatusCode(),
                    e.getCode(),
                    e.getMessage(),
                    e
            );
            throw new BadRequestException("Stripe error: " + e.getMessage());
        }
    }
}
