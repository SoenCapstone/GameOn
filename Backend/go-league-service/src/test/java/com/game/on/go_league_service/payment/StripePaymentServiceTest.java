package com.game.on.go_league_service.payment;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.BadRequestException;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentRequest;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentResponse;
import com.game.on.go_league_service.payment.mapper.PaymentMapper;
import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.model.PaymentStatus;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import com.game.on.go_league_service.payment.service.StripePaymentService;
import com.stripe.exception.ApiException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StripePaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentMapper paymentMapper;

    @Mock
    private CurrentUserProvider userProvider;

    @Test
    void createPaymentIntent_success_createsStripeIntent_savesPayment_andReturnsResponse() {
        StripePaymentService service =
                new StripePaymentService(paymentRepository, paymentMapper, userProvider);

        String userId = "user_123";
        UUID leagueId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();


        CreatePaymentIntentRequest req = new CreatePaymentIntentRequest(
                500L,
                "CAD",
                leagueId,
                null,
                "League fee"
        );

        Payment mappedPayment = Payment.builder()
                .userId(userId)
                .leagueId(leagueId)
                .teamId(null)
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .build();

        Payment savedPayment = Payment.builder()
                .id(paymentId)
                .userId(userId)
                .leagueId(leagueId)
                .teamId(null)
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .build();

        Payment finalSavedPayment = Payment.builder()
                .id(paymentId)
                .userId(userId)
                .leagueId(leagueId)
                .teamId(null)
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .stripePaymentIntentId("pi_123")
                .build();

        PaymentIntent stripeIntent = new PaymentIntent();
        stripeIntent.setId("pi_123");
        stripeIntent.setClientSecret("secret_abc");

        CreatePaymentIntentResponse expectedResponse =
                new CreatePaymentIntentResponse(
                        paymentId,
                        "pi_123",
                        "secret_abc",
                        req.amount(),
                        req.currency().toLowerCase(),
                        PaymentStatus.CREATED
                );

        when(userProvider.clerkUserId()).thenReturn(userId);
        when(paymentMapper.toPayment(req, userId)).thenReturn(mappedPayment);
        when(paymentRepository.save(any(Payment.class)))
                .thenReturn(savedPayment, finalSavedPayment);
        when(paymentMapper.toPaymentIntentResponse(finalSavedPayment, stripeIntent))
                .thenReturn(expectedResponse);

        try (MockedStatic<PaymentIntent> mocked = Mockito.mockStatic(PaymentIntent.class)) {
            mocked.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)))
                    .thenReturn(stripeIntent);

            CreatePaymentIntentResponse actual =
                    service.createPaymentIntent(req);

            assertNotNull(actual);
            assertEquals(expectedResponse, actual);

            verify(paymentRepository, times(2)).save(any(Payment.class));
            mocked.verify(
                    () -> PaymentIntent.create(any(PaymentIntentCreateParams.class)),
                    times(1)
            );

            ArgumentCaptor<Payment> captor =
                    ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, times(2)).save(captor.capture());

            Payment secondSave = captor.getAllValues().get(1);
            assertEquals("pi_123", secondSave.getStripePaymentIntentId());
        }
    }

    @Test
    void createPaymentIntent_stripeFailure_marksPaymentFailed_andThrowsBadRequest() {
        StripePaymentService service =
                new StripePaymentService(paymentRepository, paymentMapper, userProvider);

        String userId = "user_123";
        UUID leagueId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();


        CreatePaymentIntentRequest req = new CreatePaymentIntentRequest(
                500L,
                "CAD",
                leagueId,
                null,
                "League fee"
        );

        Payment mappedPayment = Payment.builder()
                .userId(userId)
                .leagueId(leagueId)
                .teamId(null)
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .build();

        Payment savedPayment = Payment.builder()
                .id(paymentId)
                .userId(userId)
                .leagueId(leagueId)
                .teamId(null) 
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .build();

        when(userProvider.clerkUserId()).thenReturn(userId);
        when(paymentMapper.toPayment(req, userId)).thenReturn(mappedPayment);
        when(paymentRepository.save(any(Payment.class)))
                .thenReturn(savedPayment);

        ApiException stripeError =
                new ApiException("boom", null, null, Integer.valueOf(400), null);

        try (MockedStatic<PaymentIntent> mocked = Mockito.mockStatic(PaymentIntent.class)) {
            mocked.when(() -> PaymentIntent.create(any(PaymentIntentCreateParams.class)))
                    .thenThrow(stripeError);

            BadRequestException ex = assertThrows(
                    BadRequestException.class,
                    () -> service.createPaymentIntent(req)
            );

            assertTrue(ex.getMessage().startsWith("Stripe error:"));

            ArgumentCaptor<Payment> captor =
                    ArgumentCaptor.forClass(Payment.class);
            verify(paymentRepository, times(2)).save(captor.capture());

            Payment failedPayment = captor.getAllValues().get(1);
            assertEquals(PaymentStatus.FAILED, failedPayment.getStatus());
        }
    }
}
