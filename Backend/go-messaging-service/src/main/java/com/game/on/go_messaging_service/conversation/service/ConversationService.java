package com.game.on.go_messaging_service.conversation.service;

import com.game.on.go_messaging_service.client.TeamDirectoryService;
import com.game.on.go_messaging_service.client.TeamSnapshot;
import com.game.on.go_messaging_service.conversation.dto.ConversationListResponse;
import com.game.on.go_messaging_service.conversation.dto.ConversationResponse;
import com.game.on.go_messaging_service.conversation.dto.DirectConversationRequest;
import com.game.on.go_messaging_service.conversation.dto.TeamConversationRequest;
import com.game.on.go_messaging_service.conversation.model.Conversation;
import com.game.on.go_messaging_service.conversation.model.ConversationParticipant;
import com.game.on.go_messaging_service.conversation.model.ConversationParticipantRole;
import com.game.on.go_messaging_service.conversation.model.ConversationType;
import com.game.on.go_messaging_service.conversation.repository.ConversationParticipantRepository;
import com.game.on.go_messaging_service.conversation.repository.ConversationRepository;
import com.game.on.go_messaging_service.exception.BadRequestException;
import com.game.on.go_messaging_service.exception.ConflictException;
import com.game.on.go_messaging_service.exception.ForbiddenException;
import com.game.on.go_messaging_service.exception.NotFoundException;
import com.game.on.go_messaging_service.message.model.Message;
import com.game.on.go_messaging_service.message.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final TeamDirectoryService teamDirectoryService;
    private final ConversationMapper conversationMapper;

    private static final int MAX_GROUP_NAME = 120;

    @Transactional
    public ConversationResponse createDirectConversation(DirectConversationRequest request, String callerId) {
        var targetUserId = request.targetUserId();
        if (targetUserId.equals(callerId)) {
            throw new BadRequestException("Cannot start a direct conversation with yourself");
        }
        var ordered = new java.util.ArrayList<>(List.of(callerId, targetUserId));
        ordered.sort(String::compareTo);
        var first = ordered.get(0);
        var second = ordered.get(1);
        var existing = conversationRepository.findByDirectUserOneIdAndDirectUserTwoId(first, second);
        if (existing.isPresent()) {
            return buildResponse(existing.get());
        }
        try {
            var conversation = Conversation.builder()
                    .type(ConversationType.DIRECT)
                    .createdByUserId(callerId)
                    .event(false)
                    .directUserOneId(first)
                    .directUserTwoId(second)
                    .build();
            var saved = conversationRepository.save(conversation);
            var participants = List.of(
                    buildParticipant(saved, callerId, ConversationParticipantRole.OWNER),
                    buildParticipant(saved, targetUserId, ConversationParticipantRole.MEMBER)
            );
            participantRepository.saveAll(participants);
            return buildResponse(saved, participants, null);
        } catch (DataIntegrityViolationException ex) {
            var existingConversation = conversationRepository.findByDirectUserOneIdAndDirectUserTwoId(first, second)
                    .orElseThrow(() -> new ConflictException("Unable to create conversation"));
            return buildResponse(existingConversation);
        }
    }

    @Transactional
    public ConversationResponse createTeamConversation(UUID teamId,
                                                       TeamConversationRequest request,
                                                       String callerId) {
        var snapshot = teamDirectoryService.fetchSnapshot(teamId);
        if (!snapshot.isOwner(callerId)) {
            throw new ForbiddenException("Only the team owner can create a team chat");
        }
        if (!StringUtils.hasText(request.name())) {
            throw new BadRequestException("Conversation name is required");
        }
        var trimmedName = request.name().trim();
        if (trimmedName.length() > MAX_GROUP_NAME) {
            throw new BadRequestException("Conversation name exceeds max length");
        }
        var conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .teamId(teamId)
                .name(trimmedName)
                .event(request.isEvent())
                .createdByUserId(callerId)
                .build();
        var saved = conversationRepository.save(conversation);
        var participants = new ArrayList<>(snapshot.activeMembers().stream()
                .map(member -> buildParticipant(saved,
                        member.userId(),
                        member.userId().equals(snapshot.ownerUserId()) ? ConversationParticipantRole.OWNER : ConversationParticipantRole.MEMBER,
                        member.joinedAt()))
                .collect(Collectors.toList()));
        if (participants.stream().noneMatch(p -> Objects.equals(p.getUserId(), snapshot.ownerUserId()))) {
            participants.add(buildParticipant(saved, snapshot.ownerUserId(), ConversationParticipantRole.OWNER));
        }
        participantRepository.saveAll(participants);
        return buildResponse(saved, participants, null);
    }

    @Transactional
    public ConversationListResponse listConversations(String callerId) {
        var conversationIds = new ArrayList<>(conversationRepository.findConversationIdsForUser(callerId));
        var conversationIdSet = new HashSet<>(conversationIds);

        var teamIds = teamDirectoryService.fetchActiveTeamIdsForUser();
        if (!teamIds.isEmpty()) {
            var teamConversations = conversationRepository.findByTeamIdInAndEventFalse(teamIds);
            if (!teamConversations.isEmpty()) {
                Map<UUID, TeamSnapshot> teamSnapshots = new HashMap<>();
                for (var conversation : teamConversations) {
                    if (!conversationIdSet.add(conversation.getId())) {
                        continue;
                    }
                    try {
                        var snapshot = teamSnapshots.computeIfAbsent(
                                conversation.getTeamId(),
                                teamDirectoryService::fetchSnapshot
                        );
                        ensureParticipantForTeamConversation(conversation, callerId, snapshot);
                        conversationIds.add(conversation.getId());
                    } catch (ForbiddenException ex) {
                        log.debug("conversation_access_denied conversationId={} userId={}",
                                conversation.getId(), callerId);
                    }
                }
            }
        }

        if (conversationIds.isEmpty()) {
            return new ConversationListResponse(List.of());
        }

        var conversations = conversationRepository.findByIdIn(conversationIds);
        Map<UUID, Conversation> conversationMap = conversations.stream()
                .collect(Collectors.toMap(Conversation::getId, c -> c));
        var participants = participantRepository.findByConversationIdIn(conversationIds);
        Map<UUID, List<ConversationParticipant>> participantMap = participants.stream()
                .collect(Collectors.groupingBy(participant -> participant.getConversation().getId()));

        List<ConversationResponse> responses = new ArrayList<>();
        for (UUID conversationId : conversationIds) {
            var conversation = conversationMap.get(conversationId);
            if (conversation == null) {
                continue;
            }
            var lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversationId)
                    .orElse(null);
            var participantList = participantMap.getOrDefault(conversationId, List.of());
            responses.add(conversationMapper.toConversationResponse(conversation, participantList, lastMessage));
        }
        return new ConversationListResponse(responses);
    }

    @Transactional(readOnly = true)
    public Conversation requireConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException("Conversation not found"));
    }

    @Transactional
    public ConversationParticipant requireParticipant(UUID conversationId, String userId) {
        var conversation = requireConversation(conversationId);
        return ensureParticipant(conversation, userId);
    }

    private ConversationParticipant ensureParticipant(Conversation conversation, String userId) {
        var participant = participantRepository.findByConversationIdAndUserId(conversation.getId(), userId)
                .orElse(null);
        if (conversation.isDirect()) {
            if (!Objects.equals(conversation.getDirectUserOneId(), userId)
                    && !Objects.equals(conversation.getDirectUserTwoId(), userId)) {
                throw new ForbiddenException("You are not part of this conversation");
            }
            if (participant == null) {
                participant = participantRepository.save(buildParticipant(conversation, userId,
                        Objects.equals(conversation.getCreatedByUserId(), userId)
                                ? ConversationParticipantRole.OWNER
                                : ConversationParticipantRole.MEMBER));
            }
            return participant;
        }

        if (conversation.getTeamId() == null) {
            throw new ForbiddenException("Conversation is not associated with a team");
        }
        TeamSnapshot snapshot = teamDirectoryService.fetchSnapshot(conversation.getTeamId());
        return ensureParticipantForTeamConversation(conversation, userId, snapshot, participant);
    }

    private ConversationParticipant ensureParticipantForTeamConversation(Conversation conversation,
                                                                         String userId,
                                                                         TeamSnapshot snapshot) {
        var participant = participantRepository.findByConversationIdAndUserId(conversation.getId(), userId)
                .orElse(null);
        return ensureParticipantForTeamConversation(conversation, userId, snapshot, participant);
    }

    private ConversationParticipant ensureParticipantForTeamConversation(Conversation conversation,
                                                                         String userId,
                                                                         TeamSnapshot snapshot,
                                                                         ConversationParticipant participant) {
        if (!snapshot.isActiveMember(userId)) {
            if (participant != null) {
                participantRepository.delete(participant);
            }
            throw new ForbiddenException("You are not an active member of this team");
        }
        if (participant == null) {
            if (conversation.isEvent()) {
                throw new ForbiddenException("Event chat membership is locked");
            }
            participant = participantRepository.save(buildParticipant(conversation, userId,
                    snapshot.isOwner(userId) ? ConversationParticipantRole.OWNER : ConversationParticipantRole.MEMBER));
        }
        return participant;
    }

    private ConversationResponse buildResponse(Conversation conversation) {
        var participants = participantRepository.findByConversationId(conversation.getId());
        var lastMessage = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);
        return conversationMapper.toConversationResponse(conversation, participants, lastMessage);
    }

    private ConversationResponse buildResponse(Conversation conversation,
                                               List<ConversationParticipant> participants,
                                               Message lastMessage) {
        return conversationMapper.toConversationResponse(conversation, participants, lastMessage);
    }

    private ConversationParticipant buildParticipant(Conversation conversation,
                                                     String userId,
                                                     ConversationParticipantRole role) {
        return buildParticipant(conversation, userId, role, null);
    }

    private ConversationParticipant buildParticipant(Conversation conversation,
                                                     String userId,
                                                     ConversationParticipantRole role,
                                                     OffsetDateTime joinedAt) {
        return ConversationParticipant.builder()
                .conversation(conversation)
                .userId(userId)
                .role(role)
                .joinedAt(joinedAt == null ? OffsetDateTime.now() : joinedAt)
                .build();
    }
}
