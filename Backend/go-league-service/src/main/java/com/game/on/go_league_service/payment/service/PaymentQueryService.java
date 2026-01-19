package com.game.on.go_league_service.payment.service;

import com.game.on.go_league_service.config.CurrentUserProvider;
import com.game.on.go_league_service.exception.ForbiddenException;
import com.game.on.go_league_service.exception.NotFoundException;
import com.game.on.go_league_service.payment.dto.PaymentResponse;
import com.game.on.go_league_service.payment.mapper.PaymentMapper;
import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentQueryService {

    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final CurrentUserProvider userProvider;

    public PaymentResponse getPayment(UUID paymentId) {
        String callerId = userProvider.clerkUserId();

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + paymentId));

        ensureCanView(payment, callerId);

        return paymentMapper.toPaymentResponse(payment);
    }

    private void ensureCanView(Payment payment, String callerId) {
        if (!payment.getUserId().equals(callerId)) {
            throw new ForbiddenException("Access denied");
        }
    }
}
