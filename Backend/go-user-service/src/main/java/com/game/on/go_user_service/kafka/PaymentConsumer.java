package com.game.on.go_user_service.kafka;
import com.game.on.common.dto.PaymentDTO;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class PaymentConsumer {

    @KafkaListener(topics = "go-payment", groupId = "payment-service")
    public void onPaymentCreated(ConsumerRecord<String, PaymentDTO> record) {
        String key = record.key();
        PaymentDTO paymentDTO = record.value();

        /* TO DO: Replace with actual logic once Payment/ stripe is implemented */
        log.info("Received payment event:");
        log.info("Key: {}", key);
        log.info("DTO: {}", paymentDTO);
    }
}

