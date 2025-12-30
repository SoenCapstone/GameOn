package com.game.on.go_messaging_service.message.repository;

import com.game.on.go_messaging_service.message.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
            select m from Message m
            where m.conversation.id = :conversationId
              and m.deletedAt is null
            order by m.createdAt desc
            """)
    List<Message> findMessages(@Param("conversationId") UUID conversationId,
                               Pageable pageable);

    @Query("""
            select m from Message m
            where m.conversation.id = :conversationId
              and m.deletedAt is null
              and m.createdAt < :before
            order by m.createdAt desc
            """)
    List<Message> findMessagesBefore(@Param("conversationId") UUID conversationId,
                                     @Param("before") OffsetDateTime before,
                                     Pageable pageable);

    Optional<Message> findTopByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
