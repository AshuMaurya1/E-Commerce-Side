package com.shopsphere.user.dto;

import com.shopsphere.user.Role;
import com.shopsphere.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class UserDtos {

    private UserDtos() {}

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            Role role,
            boolean active,
            Instant createdAt
    ) {
        public static UserResponse from(User user) {
            return new UserResponse(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRole(),
                    user.isActive(),
                    user.getCreatedAt()
            );
        }
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120, message = "Full name must be between 2 and 120 characters")
            String fullName,

            @Pattern(regexp = "^$|^[0-9+\\-\\s]{7,20}$", message = "Phone number format is invalid")
            String phone
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                    message = "Password must include uppercase, lowercase, and a number"
            )
            String newPassword
    ) {}
}
