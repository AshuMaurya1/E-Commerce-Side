package com.shopsphere.address.dto;

import com.shopsphere.address.Address;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class AddressDtos {

    private AddressDtos() {}

    public record AddressRequest(
            @NotBlank(message = "Recipient name is required")
            @Size(min = 2, max = 120, message = "Recipient name must be between 2 and 120 characters")
            String recipientName,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^[0-9+\\-\\s]{7,20}$", message = "Phone number format is invalid")
            String phone,

            @NotBlank(message = "Address line 1 is required")
            @Size(max = 255)
            String line1,

            @Size(max = 255)
            String line2,

            @NotBlank(message = "City is required")
            @Size(max = 100)
            String city,

            @NotBlank(message = "State is required")
            @Size(max = 100)
            String state,

            @NotBlank(message = "Postal code is required")
            @Size(min = 4, max = 20, message = "Postal code must be between 4 and 20 characters")
            String postalCode,

            @Size(max = 80)
            String country,

            @Size(max = 40)
            String label,

            boolean defaultAddress
    ) {}

    public record AddressResponse(
            Long id,
            String recipientName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String postalCode,
            String country,
            String label,
            boolean defaultAddress,
            Instant createdAt
    ) {
        public static AddressResponse from(Address address) {
            return new AddressResponse(
                    address.getId(),
                    address.getRecipientName(),
                    address.getPhone(),
                    address.getLine1(),
                    address.getLine2(),
                    address.getCity(),
                    address.getState(),
                    address.getPostalCode(),
                    address.getCountry(),
                    address.getLabel(),
                    address.isDefaultAddress(),
                    address.getCreatedAt()
            );
        }
    }
}
