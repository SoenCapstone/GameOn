package com.game.on.go_league_service.league.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
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
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "referee_profiles")
@EntityListeners(AuditingEntityListener.class)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RefereeProfile {

    @Id
    @EqualsAndHashCode.Include
    @Column(name = "user_id", length = 255)
    private String userId;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "referee_sports", joinColumns = @JoinColumn(name = "referee_user_id"))
    @Column(name = "sport", length = 75)
    private List<String> sports = new ArrayList<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "referee_allowed_regions", joinColumns = @JoinColumn(name = "referee_user_id"))
    @Column(name = "region", length = 100)
    private List<String> allowedRegions = new ArrayList<>();

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
