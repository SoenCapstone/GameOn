package com.game.on.go_league_service.payment;

import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.model.PaymentStatus;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import com.game.on.go_league_service.payment.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StripeWebhookServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    private static void setWebhookSecret(StripeWebhookService service, String secret) {
        try {
            Field f = StripeWebhookService.class.getDeclaredField("webhookSecret");
            f.setAccessible(true);
            f.set(service, secret);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    private static Event mockEventWithPaymentIntentObject(String type, PaymentIntent pi) {
        Event event = mock(Event.class);
        when(event.getType()).thenReturn(type);

        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(Optional.of(pi));

        return event;
    }

    private static Event mockEventWithRawJson(String type, String rawJson) {
        Event event = mock(Event.class);
        when(event.getType()).thenReturn(type);

        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);

        when(deserializer.getObject()).thenReturn(Optional.empty());
        when(deserializer.getRawJson()).thenReturn(rawJson);

        return event;
    }

    @Test
    void verifyAndConstructEvent_throwsIllegalState_whenWebhookSecretMissing() {
        StripeWebhookService service = new StripeWebhookService(paymentRepository);
        setWebhookSecret(service, ""); // blank secret

        assertThrows(IllegalStateException.class,
                () -> service.verifyAndConstructEvent("{}", "sig"));
    }

    @Test
    void verifyAndConstructEvent_callsStripeWebhookConstructEvent_whenSecretConfigured()
            throws SignatureVerificationException {

        StripeWebhookService service = new StripeWebhookService(paymentRepository);
        setWebhookSecret(service, "whsec_test");

        String payload = "{\"id\":\"evt_1\"}";
        String sig = "sig_header";

        Event expected = new Event();
        expected.setId("evt_1");
        expected.setType("payment_intent.succeeded");

        try (MockedStatic<Webhook> mocked = Mockito.mockStatic(Webhook.class)) {
            mocked.when(() -> Webhook.constructEvent(payload, sig, "whsec_test"))
                    .thenReturn(expected);

            Event actual = service.verifyAndConstructEvent(payload, sig);

            assertNotNull(actual);
            assertEquals("evt_1", actual.getId());

            mocked.verify(() -> Webhook.constructEvent(payload, sig, "whsec_test"), times(1));
        }
    }

    @Test
    void handleEvent_succeeded_updatesPaymentByMetadata_setsSucceededAt() {
        StripeWebhookService service = new StripeWebhookService(paymentRepository);

        UUID paymentId = UUID.randomUUID();

        PaymentIntent pi = new PaymentIntent();
        pi.setId("pi_123");
        var metadata = new HashMap<String, String>();
        metadata.put("paymentId", paymentId.toString());
        pi.setMetadata(metadata);

        Event event = mockEventWithPaymentIntentObject("payment_intent.succeeded", pi);

        Payment existing = Payment.builder()
                .id(paymentId)
                .stripePaymentIntentId("pi_123")
                .status(PaymentStatus.CREATED)
                .build();

        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.handleEvent(event);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());

        Payment saved = captor.getValue();
        assertEquals(PaymentStatus.SUCCEEDED, saved.getStatus());
        assertNotNull(saved.getSucceededAt());
        assertNull(saved.getFailedAt());
        assertNull(saved.getCanceledAt());

        verify(paymentRepository, never()).findByStripePaymentIntentId(anyString());
    }

    @Test
    void handleEvent_failed_updatesPaymentByPi_whenNoMetadata_setsFailedAt() {
        StripeWebhookService service = new StripeWebhookService(paymentRepository);

        String raw = """
                {
                  "id": "pi_456",
                  "metadata": { }
                }
                """;

        Event event = mockEventWithRawJson("payment_intent.payment_failed", raw);

        Payment existing = Payment.builder()
                .id(UUID.randomUUID())
                .stripePaymentIntentId("pi_456")
                .status(PaymentStatus.CREATED)
                .build();

        when(paymentRepository.findByStripePaymentIntentId("pi_456")).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.handleEvent(event);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());

        Payment saved = captor.getValue();
        assertEquals(PaymentStatus.FAILED, saved.getStatus());
        assertNull(saved.getSucceededAt());
        assertNotNull(saved.getFailedAt());
        assertNull(saved.getCanceledAt());

        verify(paymentRepository, never()).findById(any());
    }

    @Test
    void handleEvent_canceled_updatesPaymentByPi_setsCanceledAt() {
        StripeWebhookService service = new StripeWebhookService(paymentRepository);

        String raw = """
                {
                  "id": "pi_cancel",
                  "metadata": null
                }
                """;

        Event event = mockEventWithRawJson("payment_intent.canceled", raw);

        Payment existing = Payment.builder()
                .id(UUID.randomUUID())
                .stripePaymentIntentId("pi_cancel")
                .status(PaymentStatus.CREATED)
                .build();

        when(paymentRepository.findByStripePaymentIntentId("pi_cancel")).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.handleEvent(event);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());

        Payment saved = captor.getValue();
        assertEquals(PaymentStatus.CANCELED, saved.getStatus());
        assertNull(saved.getSucceededAt());
        assertNull(saved.getFailedAt());
        assertNotNull(saved.getCanceledAt());
    }

    @Test
    void handleEvent_requiresAction_updatesPaymentByPi_setsStatusOnly() {
        StripeWebhookService service = new StripeWebhookService(paymentRepository);

        String raw = """
                {
                  "id": "pi_action",
                  "metadata": { }
                }
                """;

        Event event = mockEventWithRawJson("payment_intent.requires_action", raw);

        Payment existing = Payment.builder()
                .id(UUID.randomUUID())
                .stripePaymentIntentId("pi_action")
                .status(PaymentStatus.CREATED)
                .build();

        when(paymentRepository.findByStripePaymentIntentId("pi_action")).thenReturn(Optional.of(existing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.handleEvent(event);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());

        Payment saved = captor.getValue();
        assertEquals(PaymentStatus.REQUIRES_ACTION, saved.getStatus());
        assertNull(saved.getSucceededAt());
        assertNull(saved.getFailedAt());
        assertNull(saved.getCanceledAt());
    }
}
