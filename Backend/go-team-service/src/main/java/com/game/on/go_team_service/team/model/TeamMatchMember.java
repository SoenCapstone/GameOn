package com.game.on.go_team_service.team.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "team_match_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMatchMember {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private TeamMatch match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_member_id", nullable = false)
    private TeamMember teamMember;

    @Column(name = "team_id", nullable = false)
    private UUID teamId;

    @Enumerated(EnumType.STRING)
    private TeamRole role;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus attending;


    @Column(name = "joined_at")
    private OffsetDateTime joinedAt;
}
