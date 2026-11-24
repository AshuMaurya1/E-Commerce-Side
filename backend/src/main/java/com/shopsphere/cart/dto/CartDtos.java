package com.shopsphere.cart.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {

    private CartDtos() {}

    public record AddCartItemRequest(
            @NotNull(message = "Product ID is required")
            Long productId,

            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 50, message = "Maximum 50 units per product")
            int quantity
    ) {}

    public record UpdateCartItemRequest(
            @Min(value = 0, message = "Quantity cannot be negative")
            @Max(value = 50, message = "Maximum 50 units per product")
            int quantity
    ) {}

    public record ApplyCouponRequest(
            @NotBlank(message = "Coupon code is required")
            String code
    ) {}

    public record CartItemResponse(
            Long productId,
            String productName,
            String productSlug,
            String sku,
            String imageUrl,
            BigDecimal unitPrice,
            BigDecimal originalPrice,
            int quantity,
            int stockQuantity,
            boolean inStock,
            BigDecimal lineTotal
    ) {}

    public record CartResponse(
            Long id,
            List<CartItemResponse> items,
            int totalItems,
            BigDecimal subtotal,
            String appliedCouponCode,
            String couponMessage,
            BigDecimal discountAmount,
            BigDecimal shippingFee,
            BigDecimal totalAmount,
            BigDecimal freeShippingThreshold,
            BigDecimal amountToFreeShipping
    ) {}
}
