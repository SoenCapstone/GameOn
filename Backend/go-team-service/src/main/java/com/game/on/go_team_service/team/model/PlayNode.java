package com.game.on.go_team_service.team.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "play_nodes")
public class PlayNode {

    @Id
    @Column(nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "play_id", nullable = false)
    private Play play;

    @Column(name = "type", nullable = false)
    @Enumerated(EnumType.STRING)
    private PlayMakerShapeType type;

    @Column(name = "associated_player_id")
    private String associatedPlayerId;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    @Column(nullable = false)
    private double size;
}
