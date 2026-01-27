package com.game.on.go_messaging_service.conversation.repository;

import com.game.on.go_messaging_service.conversation.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByDirectUserOneIdAndDirectUserTwoId(String firstUserId, String secondUserId);

    @Query("""
            select c from Conversation c
            where c.teamId = :teamId and c.event = :eventOnly
            """)
    List<Conversation> findByTeamIdAndEvent(@Param("teamId") UUID teamId,
                                            @Param("eventOnly") boolean event);

    @Query("""
            select c from Conversation c
            where c.teamId in :teamIds and c.event = false
            """)
    List<Conversation> findByTeamIdInAndEventFalse(@Param("teamIds") Collection<UUID> teamIds);

    @Query("""
            select cp.conversation.id from ConversationParticipant cp
            join cp.conversation c
            where cp.userId = :userId
            order by coalesce(c.lastMessageAt, c.createdAt) desc
            """)
    List<UUID> findConversationIdsForUser(@Param("userId") String userId);

    List<Conversation> findByIdIn(Collection<UUID> ids);
}
