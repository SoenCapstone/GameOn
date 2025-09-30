package com.game.on.go_user_service.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Table(name = "user_table")
@Entity
@Builder
@AllArgsConstructor
@RequiredArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    private String firstname;

    private String lastname;

    private String email;

    private String password;
}
