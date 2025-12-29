package com.game.on.common.dto;

public record UserResponse(
        String id,

        String email,

        String firstname,

        String lastname
) {}
