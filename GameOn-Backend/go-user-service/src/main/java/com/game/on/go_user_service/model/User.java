package com.game.on.go_user_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;


@Data
@Table(name = "users")
@Entity
@Builder
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false, unique = true)
    @NonNull
    private String keycloakId;

    public User(@NonNull String keycloakId) {
        this.keycloakId = keycloakId;
    }

    public User() {

    }
}
