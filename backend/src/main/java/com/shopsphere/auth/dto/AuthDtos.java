package com.shopsphere.auth.dto;

import com.shopsphere.user.dto.UserDtos.UserResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Please enter a valid email address")
            @Size(max = 180)
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                    message = "Password must include uppercase, lowercase, and a number"
            )
            String password,

            @Pattern(regexp = "^$|^[0-9+\\-\\s]{7,20}$", message = "Phone number format is invalid")
            String phone
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Please enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    public record AuthResponse(
            String accessToken,
            long expiresInMs,
            UserResponse user
    ) {}
}
