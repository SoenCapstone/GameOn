package com.game.on.go_user_service.model;

import jakarta.persistence.*;
import lombok.*;


@Data
@Table(name = "users")
@Entity
@Builder
@AllArgsConstructor
@RequiredArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    @NonNull
    private String keycloakId;

    public User() {

    }
}
