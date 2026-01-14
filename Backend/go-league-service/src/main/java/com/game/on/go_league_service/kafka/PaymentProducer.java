package com.game.on.go_league_service.kafka;

import com.game.on.common.dto.PaymentDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentProducer {
    private final KafkaTemplate<String, PaymentDTO> paymentKafkaTemplate;

    public void sendEvent(String topic, PaymentDTO payment){
        Message<PaymentDTO> message = MessageBuilder
                .withPayload(payment)
                .setHeader(KafkaHeaders.TOPIC, topic)
                .setHeader(KafkaHeaders.KEY, payment.paymentId().toString())
                .build();

        paymentKafkaTemplate.send(message);
    }
}
