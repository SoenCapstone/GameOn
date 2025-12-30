package com.game.on.go_messaging_service.message.service;

import com.game.on.go_messaging_service.conversation.model.Conversation;
import com.game.on.go_messaging_service.conversation.model.ConversationType;
import com.game.on.go_messaging_service.conversation.repository.ConversationParticipantRepository;
import com.game.on.go_messaging_service.conversation.repository.ConversationRepository;
import com.game.on.go_messaging_service.conversation.service.ConversationMapper;
import com.game.on.go_messaging_service.conversation.service.ConversationService;
import com.game.on.go_messaging_service.exception.BadRequestException;
import com.game.on.go_messaging_service.message.dto.MessageResponse;
import com.game.on.go_messaging_service.message.model.Message;
import com.game.on.go_messaging_service.message.repository.MessageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private ConversationService conversationService;

    @Mock
    private ConversationMapper conversationMapper;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageBroadcastGateway broadcastGateway;

    @InjectMocks
    private MessageService messageService;

    @Test
    void sendMessage_rejectsBlankPayload() {
        assertThatThrownBy(() -> messageService.sendMessage(UUID.randomUUID(), "user-10", "   "))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Message content cannot be empty");

        verifyNoMoreInteractions(conversationService, messageRepository, broadcastGateway);
    }

    @Test
    void fetchHistory_requiresParticipant() {
        UUID conversationId = UUID.randomUUID();
        when(messageRepository.findMessages(eq(conversationId), any())).thenReturn(List.of());

        messageService.fetchHistory(conversationId, "user-98", 25, null);

        verify(conversationService).requireParticipant(conversationId, "user-98");
    }

    @Test
    void sendMessage_dispatchesToDirectParticipants() {
        UUID conversationId = UUID.randomUUID();
        var conversation = Conversation.builder()
                .id(conversationId)
                .type(ConversationType.DIRECT)
                .createdByUserId("user-10")
                .build();
        when(conversationService.requireConversation(conversationId)).thenReturn(conversation);
        when(participantRepository.findParticipantIds(conversationId)).thenReturn(List.of("user-10", "user-20"));
        when(messageRepository.save(any(Message.class))).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(OffsetDateTime.now());
            message.setConversation(conversation);
            return message;
        });
        when(conversationRepository.save(conversation)).thenReturn(conversation);
        when(conversationMapper.toMessageResponse(any(Message.class)))
                .thenAnswer(invocation -> {
                    Message m = invocation.getArgument(0);
                    return new MessageResponse(m.getId(), conversationId, m.getSenderId(), m.getContent(), m.getCreatedAt());
                });

        var response = messageService.sendMessage(conversationId, "user-10", "A quick ping");

        assertThat(response.content()).isEqualTo("A quick ping");
        ArgumentCaptor<Message> messageCaptor = ArgumentCaptor.forClass(Message.class);
        verify(broadcastGateway).publishToUsers(eq(List.of("user-10", "user-20")), messageCaptor.capture());
        assertThat(messageCaptor.getValue().getContent()).isEqualTo("A quick ping");
    }
}
