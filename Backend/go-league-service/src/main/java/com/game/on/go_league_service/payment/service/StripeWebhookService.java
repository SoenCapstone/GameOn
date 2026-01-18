package com.game.on.go_league_service.payment.service;

import com.game.on.go_league_service.payment.model.PaymentStatus;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private final PaymentRepository paymentRepository;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    private record PaymentIntentData(String intentId, String paymentIdMetadata) {}

    private PaymentIntentData extractPaymentIntentData(Event event) {

        Object obj = event.getDataObjectDeserializer().getObject().orElse(null);
        if (obj instanceof PaymentIntent pi) {
            String paymentId = (pi.getMetadata() != null) ? pi.getMetadata().get("paymentId") : null;
            return new PaymentIntentData(pi.getId(), paymentId);
        }


        String raw = event.getDataObjectDeserializer().getRawJson();
        if (raw == null || raw.isBlank()) {
            log.warn("stripe_webhook_no_data_object type={} id={}", event.getType(), event.getId());
            return null;
        }

        try {
            JsonObject root = JsonParser.parseString(raw).getAsJsonObject();

            String intentId = root.has("id") && !root.get("id").isJsonNull()
                    ? root.get("id").getAsString()
                    : null;

            String paymentId = null;
            if (root.has("metadata") && root.get("metadata").isJsonObject()) {
                JsonObject metadata = root.getAsJsonObject("metadata");
                JsonElement pid = metadata.get("paymentId");
                if (pid != null && !pid.isJsonNull()) {
                    paymentId = pid.getAsString();
                }
            }

            if (intentId == null || intentId.isBlank()) {
                log.warn("stripe_webhook_missing_intent_id type={} id={} raw={}", event.getType(), event.getId(), raw);
                return null;
            }

            return new PaymentIntentData(intentId, paymentId);

        } catch (Exception e) {
            log.warn("stripe_webhook_parse_failed type={} id={} raw={}", event.getType(), event.getId(), raw, e);
            return null;
        }
    }

    public Event verifyAndConstructEvent(String payload, String sigHeader) throws SignatureVerificationException {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new IllegalStateException("stripe.webhook-secret is not configured");
        }
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }

    public void handleEvent(Event event) {
        switch (event.getType()) {
            case "payment_intent.succeeded" -> handleSucceeded(event);
            case "payment_intent.payment_failed" -> handleFailed(event);
            case "payment_intent.canceled" -> handleCanceled(event);
            case "payment_intent.requires_action" -> handleRequiresAction(event);
            default -> {
                // ignore other events
            }
        }
    }

    private void handleSucceeded(Event event) {
        PaymentIntentData data = extractPaymentIntentData(event);
        if (data == null) return;

        updateStatus(data, PaymentStatus.SUCCEEDED, OffsetDateTime.now(), null, null);
    }

    private void handleFailed(Event event) {
        PaymentIntentData data = extractPaymentIntentData(event);
        if (data == null) return;

        updateStatus(data, PaymentStatus.FAILED, null, OffsetDateTime.now(), null);
    }

    private void handleCanceled(Event event) {
        PaymentIntentData data = extractPaymentIntentData(event);
        if (data == null) return;

        updateStatus(data, PaymentStatus.CANCELED, null, null, OffsetDateTime.now());
    }

    private void handleRequiresAction(Event event) {
        PaymentIntentData data = extractPaymentIntentData(event);
        if (data == null) return;

        updateStatus(data, PaymentStatus.REQUIRES_ACTION, null, null, null);
    }

    private void updateStatus(
            PaymentIntentData data,
            PaymentStatus status,
            OffsetDateTime succeededAt,
            OffsetDateTime failedAt,
            OffsetDateTime canceledAt
    ) {

        if (data.paymentIdMetadata() != null && !data.paymentIdMetadata().isBlank()) {
            UUID paymentId = UUID.fromString(data.paymentIdMetadata());

            paymentRepository.findById(paymentId).ifPresentOrElse(payment -> {
                payment.setStatus(status);
                if (succeededAt != null) payment.setSucceededAt(succeededAt);
                if (failedAt != null) payment.setFailedAt(failedAt);
                if (canceledAt != null) payment.setCanceledAt(canceledAt);

                paymentRepository.save(payment);
                log.info("payment_updated status={} paymentId={} pi={}", status, paymentId, data.intentId());
            }, () -> log.warn("payment_not_found_by_metadata paymentId={} pi={}", data.paymentIdMetadata(), data.intentId()));

            return;
        }


        paymentRepository.findByStripePaymentIntentId(data.intentId()).ifPresentOrElse(payment -> {
            payment.setStatus(status);
            if (succeededAt != null) payment.setSucceededAt(succeededAt);
            if (failedAt != null) payment.setFailedAt(failedAt);
            if (canceledAt != null) payment.setCanceledAt(canceledAt);

            paymentRepository.save(payment);
            log.info("payment_updated_by_pi status={} pi={} paymentId={}", status, data.intentId(), payment.getId());
        }, () -> log.warn("payment_not_found_by_pi pi={}", data.intentId()));
    }
}
