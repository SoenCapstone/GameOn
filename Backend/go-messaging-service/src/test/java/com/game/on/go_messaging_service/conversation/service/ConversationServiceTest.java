package com.game.on.go_messaging_service.conversation.service;

import com.game.on.go_messaging_service.client.TeamDirectoryService;
import com.game.on.go_messaging_service.client.TeamSnapshot;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMember;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMemberRole;
import com.game.on.go_messaging_service.client.dto.RemoteTeamMemberStatus;
import com.game.on.go_messaging_service.conversation.dto.DirectConversationRequest;
import com.game.on.go_messaging_service.conversation.dto.TeamConversationRequest;
import com.game.on.go_messaging_service.conversation.model.ConversationType;
import com.game.on.go_messaging_service.conversation.repository.ConversationParticipantRepository;
import com.game.on.go_messaging_service.exception.BadRequestException;
import com.game.on.go_messaging_service.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@DataJpaTest
@Import({ConversationService.class, ConversationMapper.class})
class ConversationServiceTest {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private ConversationParticipantRepository participantRepository;

    @MockBean
    private TeamDirectoryService teamDirectoryService;

    @Test
    void createDirectConversation_createsParticipants() {
        var response = conversationService.createDirectConversation(new DirectConversationRequest(200L), 100L);

        assertThat(response.type()).isEqualTo(ConversationType.DIRECT);
        assertThat(response.participants()).hasSize(2);
        assertThat(participantRepository.findByConversationId(response.id())).hasSize(2);
    }

    @Test
    void createDirectConversation_preventsSelfMessaging() {
        assertThatThrownBy(() -> conversationService.createDirectConversation(new DirectConversationRequest(42L), 42L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot start a direct conversation with yourself");
    }

    @Test
    void createDirectConversation_reusesExistingRoom() {
        var first = conversationService.createDirectConversation(new DirectConversationRequest(301L), 111L);
        var second = conversationService.createDirectConversation(new DirectConversationRequest(111L), 301L);

        assertThat(second.id()).isEqualTo(first.id());
        assertThat(participantRepository.findByConversationId(first.id())).hasSize(2);
    }

    @Test
    void createTeamConversation_requiresOwner() {
        UUID teamId = UUID.randomUUID();
        long ownerId = 501L;
        long memberId = 777L;
        var snapshot = teamSnapshot(teamId, ownerId, ownerId, memberId);
        when(teamDirectoryService.fetchSnapshot(teamId)).thenReturn(snapshot);

        var response = conversationService.createTeamConversation(teamId, new TeamConversationRequest("Locker room", false), ownerId);

        assertThat(response.type()).isEqualTo(ConversationType.GROUP);
        assertThat(response.participants()).extracting(p -> p.userId())
                .containsExactlyInAnyOrder(ownerId, memberId);

        when(teamDirectoryService.fetchSnapshot(teamId)).thenReturn(snapshot);
        assertThatThrownBy(() -> conversationService.createTeamConversation(teamId, new TeamConversationRequest("Locker room", false), memberId))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void eventConversation_preventsNewMembers() {
        UUID teamId = UUID.randomUUID();
        long ownerId = 950L;
        long memberId = 951L;
        long newMemberId = 952L;
        var initialSnapshot = teamSnapshot(teamId, ownerId, ownerId, memberId);
        var expandedSnapshot = teamSnapshot(teamId, ownerId, ownerId, memberId, newMemberId);
        when(teamDirectoryService.fetchSnapshot(teamId)).thenReturn(initialSnapshot, expandedSnapshot);

        var response = conversationService.createTeamConversation(teamId, new TeamConversationRequest("Watch party", true), ownerId);

        assertThatThrownBy(() -> conversationService.requireParticipant(response.id(), newMemberId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Event chat membership is locked");
    }

    private TeamSnapshot teamSnapshot(UUID teamId, Long ownerId, Long... userIds) {
        List<RemoteTeamMember> members = java.util.Arrays.stream(userIds)
                .distinct()
                .map(userId -> new RemoteTeamMember(
                        userId,
                        userId.equals(ownerId) ? RemoteTeamMemberRole.OWNER : RemoteTeamMemberRole.PLAYER,
                        RemoteTeamMemberStatus.ACTIVE,
                        OffsetDateTime.now().minusDays(1)))
                .toList();
        return new TeamSnapshot(teamId, ownerId, members);
    }
}
