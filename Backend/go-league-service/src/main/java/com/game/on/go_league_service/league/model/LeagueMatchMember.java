package com.game.on.go_league_service.league.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "league_match_members")
public class LeagueMatchMember {

    @Id
    private UUID id;

    @ManyToOne
    private LeagueMatch match;

    private UUID teamId;

    private String userId;

    private String role;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status;
}
