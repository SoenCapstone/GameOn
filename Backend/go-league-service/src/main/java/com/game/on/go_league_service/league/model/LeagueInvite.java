package com.game.on.go_league_service.league.model;

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
@Table(name = "league_invites")
@EntityListeners(AuditingEntityListener.class)
public class LeagueInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "league_id", nullable = false)
    private UUID leagueId;

    @Column(name = "invited_by_user_id", nullable = false)
    private Long invitedByUserId;

    @Column(name = "invitee_user_id")
    private Long inviteeUserId;

    @Column(name = "invitee_email", length = 255)
    private String inviteeEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeagueInviteStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LeagueRole role;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "responded_at")
    private OffsetDateTime respondedAt;
}
