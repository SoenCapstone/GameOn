package com.game.on.go_messaging_service.conversation.controller;

import com.game.on.go_messaging_service.auth.CurrentUserProvider;
import com.game.on.go_messaging_service.conversation.dto.ConversationListResponse;
import com.game.on.go_messaging_service.conversation.dto.ConversationResponse;
import com.game.on.go_messaging_service.conversation.dto.DirectConversationRequest;
import com.game.on.go_messaging_service.conversation.dto.TeamConversationRequest;
import com.game.on.go_messaging_service.conversation.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messaging")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/conversations/direct")
    public ResponseEntity<ConversationResponse> createDirect(@Valid @RequestBody DirectConversationRequest request) {
        var response = conversationService.createDirectConversation(request, currentUserProvider.requireUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/teams/{teamId}/conversations")
    public ResponseEntity<ConversationResponse> createTeamConversation(@PathVariable UUID teamId,
                                                                       @Valid @RequestBody TeamConversationRequest request) {
        var response = conversationService.createTeamConversation(teamId, request, currentUserProvider.requireUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<ConversationListResponse> listConversations() {
        var response = conversationService.listConversations(currentUserProvider.requireUserId());
        return ResponseEntity.ok(response);
    }
}
