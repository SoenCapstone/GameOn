package com.game.on.go_messaging_service.conversation.repository;

import com.game.on.go_messaging_service.conversation.model.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {

    Optional<ConversationParticipant> findByConversationIdAndUserId(UUID conversationId, Long userId);

    List<ConversationParticipant> findByConversationId(UUID conversationId);

    List<ConversationParticipant> findByConversationIdIn(Collection<UUID> conversationIds);

    boolean existsByConversationIdAndUserId(UUID conversationId, Long userId);

    @Query("select cp.userId from ConversationParticipant cp where cp.conversation.id = :conversationId")
    List<Long> findParticipantIds(@Param("conversationId") UUID conversationId);
}
