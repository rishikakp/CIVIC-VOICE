package com.civicvoice.dto;

import java.time.Instant;

public record UserResponse(
        String id,
        String email,
        String firstName,
        String lastName,
        String imageUrl,
        boolean admin,
        Instant createdAt
) {}
