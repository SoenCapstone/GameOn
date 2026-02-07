package com.game.on.go_team_service.team_announcement.model;

import jakarta.persistence.*;
import lombok.*;
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
@Table(name = "team_announcements")
@EntityListeners(AuditingEntityListener.class)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TeamAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Column(name = "author_user_id", nullable = false, length = 255)
    private String authorUserId;

    @Column(name = "title", length = 120)
    private String title;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 30)
    private TeamAnnouncementScope scope;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (scope == null) {
            scope = TeamAnnouncementScope.MEMBERS_ONLY;
        }
    }
}
