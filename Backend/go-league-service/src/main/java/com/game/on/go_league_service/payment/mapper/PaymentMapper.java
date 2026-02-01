package com.game.on.go_league_service.payment.mapper;

import com.game.on.go_league_service.payment.dto.CreatePaymentIntentRequest;
import com.game.on.go_league_service.payment.dto.CreatePaymentIntentResponse;
import com.game.on.go_league_service.payment.dto.PaymentResponse;
import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.model.PaymentStatus;
import com.stripe.model.PaymentIntent;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public Payment toPayment(CreatePaymentIntentRequest req, String userId) {
        return Payment.builder()
                .userId(userId)
                .leagueId(req.leagueId())
                .teamId(req.teamId())
                .amount(req.amount())
                .currency(req.currency().toLowerCase())
                .status(PaymentStatus.CREATED)
                .build();
    }

    public CreatePaymentIntentResponse toPaymentIntentResponse(Payment payment, PaymentIntent intent) {
        return new CreatePaymentIntentResponse(
                payment.getId(),
                intent.getId(),
                intent.getClientSecret(),
                intent.getAmount(),
                intent.getCurrency(),
                payment.getStatus()
        );
    }

    public PaymentResponse toPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getLeagueId(),
                payment.getTeamId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getCreatedAt()
        );
    }


}
