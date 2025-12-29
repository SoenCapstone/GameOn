package com.game.on.go_messaging_service.message.controller;

import com.game.on.go_messaging_service.auth.CurrentUserProvider;
import com.game.on.go_messaging_service.message.dto.SendMessageRequest;
import com.game.on.go_messaging_service.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class MessagingWebSocketController {

    private final MessageService messageService;
    private final CurrentUserProvider currentUserProvider;

    @MessageMapping("/messages/send")
    public void send(@Valid SendMessageRequest request) {
        var senderId = currentUserProvider.requireUserId();
        messageService.sendMessage(request.conversationId(), senderId, request.content());
    }
}
