package com.game.on.go_messaging_service.message.controller;

import com.game.on.go_messaging_service.auth.CurrentUserProvider;
import com.game.on.go_messaging_service.exception.BadRequestException;
import com.game.on.go_messaging_service.message.dto.MessageCreateRequest;
import com.game.on.go_messaging_service.message.dto.MessageHistoryResponse;
import com.game.on.go_messaging_service.message.dto.MessageResponse;
import com.game.on.go_messaging_service.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messaging")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(@PathVariable UUID conversationId,
                                                       @Valid @RequestBody MessageCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.sendMessage(conversationId,
                        currentUserProvider.requireUserId(),
                        request.content()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageHistoryResponse> getHistory(@PathVariable UUID conversationId,
                                                             @RequestParam(value = "limit", required = false) Integer limit,
                                                             @RequestParam(value = "before", required = false) String before) {
        OffsetDateTime beforeTimestamp = null;
        if (before != null) {
            try {
                beforeTimestamp = OffsetDateTime.parse(before);
            } catch (DateTimeParseException ex) {
                throw new BadRequestException("Invalid before timestamp");
            }
        }
        return ResponseEntity.ok(messageService.fetchHistory(conversationId,
                currentUserProvider.requireUserId(),
                limit,
                beforeTimestamp));
    }
}
