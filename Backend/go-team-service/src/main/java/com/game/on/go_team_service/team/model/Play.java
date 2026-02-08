package com.game.on.go_team_service.team.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Entity
@Builder
@Table(name = "plays")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Play {

    @Id
    @Column(nullable = false)
    private UUID id;

    @OneToMany(mappedBy = "play", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlayNode> nodes;

    @OneToMany(mappedBy = "play", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PlayEdge> edges;
}
