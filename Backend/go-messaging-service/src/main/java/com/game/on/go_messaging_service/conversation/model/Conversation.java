package com.game.on.go_messaging_service.conversation.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "conversations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_conversation_direct_pair",
                        columnNames = {"direct_user_one_id", "direct_user_two_id"})
        })
@EntityListeners(AuditingEntityListener.class)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConversationType type;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(length = 120)
    private String name;

    @Column(name = "created_by_user_id", nullable = false, length = 128)
    private String createdByUserId;

    @Column(name = "is_event", nullable = false)
    private boolean event;

    @Column(name = "direct_user_one_id", length = 128)
    private String directUserOneId;

    @Column(name = "direct_user_two_id", length = 128)
    private String directUserTwoId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "last_message_at")
    private OffsetDateTime lastMessageAt;

    public boolean isDirect() {
        return type == ConversationType.DIRECT;
    }

    public boolean isGroup() {
        return type == ConversationType.GROUP;
    }
}
