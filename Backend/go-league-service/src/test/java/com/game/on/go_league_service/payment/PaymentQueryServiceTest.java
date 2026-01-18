package com.game.on.go_league_service.payment;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.payment.dto.PaymentResponse;
import com.game.on.go_league_service.payment.mapper.PaymentMapper;
import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import com.game.on.go_league_service.payment.service.PaymentQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentQueryServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentMapper paymentMapper;
    @Mock private CurrentUserProvider userProvider;

    @Test
    void getPayment_success_whenCallerOwnsPayment_returnsPaymentResponse() {
        PaymentQueryService service = new PaymentQueryService(paymentRepository, paymentMapper, userProvider);

        UUID paymentId = UUID.randomUUID();
        String callerId = "user_123";

        Payment payment = Payment.builder()
                .id(paymentId)
                .userId(callerId)
                .build();

        PaymentResponse mapped = mock(PaymentResponse.class);

        when(userProvider.clerkUserId()).thenReturn(callerId);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(paymentMapper.toPaymentResponse(payment)).thenReturn(mapped);

        PaymentResponse result = service.getPayment(paymentId);

        assertSame(mapped, result);
        verify(paymentRepository, times(1)).findById(paymentId);
        verify(paymentMapper, times(1)).toPaymentResponse(payment);
    }

    @Test
    void getPayment_throwsNotFound_whenPaymentDoesNotExist() {
        PaymentQueryService service = new PaymentQueryService(paymentRepository, paymentMapper, userProvider);

        UUID paymentId = UUID.randomUUID();
        String callerId = "user_123";

        when(userProvider.clerkUserId()).thenReturn(callerId);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.empty());

        NotFoundException ex = assertThrows(NotFoundException.class, () -> service.getPayment(paymentId));
        assertTrue(ex.getMessage().contains("Payment not found"));

        verify(paymentRepository, times(1)).findById(paymentId);
        verifyNoInteractions(paymentMapper);
    }

    @Test
    void getPayment_throwsForbidden_whenCallerDoesNotOwnPayment() {
        PaymentQueryService service = new PaymentQueryService(paymentRepository, paymentMapper, userProvider);

        UUID paymentId = UUID.randomUUID();
        String callerId = "user_123";
        String ownerId = "different_user";

        Payment payment = Payment.builder()
                .id(paymentId)
                .userId(ownerId)
                .build();

        when(userProvider.clerkUserId()).thenReturn(callerId);
        when(paymentRepository.findById(paymentId)).thenReturn(Optional.of(payment));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> service.getPayment(paymentId));
        assertEquals("Access denied", ex.getMessage());

        verify(paymentRepository, times(1)).findById(paymentId);
        verifyNoInteractions(paymentMapper);
    }
}
