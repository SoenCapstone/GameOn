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
    /* Clerk ID */
    @Id
    private String id;

    private String firstname;

    private String lastname;

    private String email;
}
