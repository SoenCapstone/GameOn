package com.game.on.go_league_service.payment.repository;

import com.game.on.go_league_service.payment.model.Payment;
import com.game.on.go_league_service.payment.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    Optional<Payment> findTopByLeagueIdOrderByCreatedAtDesc(UUID leagueId);

    boolean existsByLeagueIdAndStatus(UUID leagueId, PaymentStatus status);

    boolean existsByTeamIdAndStatus(UUID teamId, PaymentStatus status);

}
