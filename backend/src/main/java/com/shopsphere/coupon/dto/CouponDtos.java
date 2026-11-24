package com.shopsphere.coupon.dto;

import com.shopsphere.coupon.Coupon;
import com.shopsphere.coupon.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class CouponDtos {

    private CouponDtos() {}

    public record CouponRequest(
            @NotBlank(message = "Coupon code is required")
            @Size(min = 3, max = 50)
            String code,

            @Size(max = 255)
            String description,

            @NotNull(message = "Discount type is required")
            DiscountType discountType,

            @NotNull(message = "Discount value is required")
            @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
            BigDecimal discountValue,

            @DecimalMin(value = "0.00")
            BigDecimal minOrderValue,

            @DecimalMin(value = "0.01")
            BigDecimal maxDiscount,

            @Min(1)
            Integer usageLimit,

            @NotNull(message = "Expiry date is required")
            Instant expiresAt,

            Boolean active
    ) {}

    public record CouponResponse(
            Long id,
            String code,
            String description,
            DiscountType discountType,
            BigDecimal discountValue,
            BigDecimal minOrderValue,
            BigDecimal maxDiscount,
            Integer usageLimit,
            int usedCount,
            Instant expiresAt,
            boolean active,
            Instant createdAt
    ) {
        public static CouponResponse from(Coupon coupon) {
            return new CouponResponse(
                    coupon.getId(),
                    coupon.getCode(),
                    coupon.getDescription(),
                    coupon.getDiscountType(),
                    coupon.getDiscountValue(),
                    coupon.getMinOrderValue(),
                    coupon.getMaxDiscount(),
                    coupon.getUsageLimit(),
                    coupon.getUsedCount(),
                    coupon.getExpiresAt(),
                    coupon.isActive(),
                    coupon.getCreatedAt()
            );
        }
    }

    public record CouponValidationResult(
            Coupon coupon,
            BigDecimal discountAmount
    ) {}
}
