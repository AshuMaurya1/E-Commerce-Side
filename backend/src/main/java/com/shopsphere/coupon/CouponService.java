package com.shopsphere.coupon;

import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.coupon.dto.CouponDtos.CouponRequest;
import com.shopsphere.coupon.dto.CouponDtos.CouponResponse;
import com.shopsphere.coupon.dto.CouponDtos.CouponValidationResult;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> listAll() {
        return couponRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(CouponResponse::from)
                .toList();
    }

    @Transactional
    public CouponResponse create(CouponRequest request) {
        String code = request.code().trim().toUpperCase();
        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Coupon code " + code + " already exists");
        }
        validateCouponRequest(request);

        Coupon coupon = new Coupon();
        coupon.setCode(code);
        applyFields(coupon, request);
        return CouponResponse.from(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        String code = request.code().trim().toUpperCase();
        if (!coupon.getCode().equalsIgnoreCase(code) && couponRepository.existsByCodeIgnoreCase(code)) {
            throw new ConflictException("Coupon code " + code + " already exists");
        }
        validateCouponRequest(request);

        coupon.setCode(code);
        applyFields(coupon, request);
        return CouponResponse.from(couponRepository.save(coupon));
    }

    @Transactional
    public CouponResponse toggleStatus(Long id, boolean active) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setActive(active);
        return CouponResponse.from(couponRepository.save(coupon));
    }

    @Transactional
    public void delete(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        couponRepository.delete(coupon);
    }

    @Transactional(readOnly = true)
    public CouponValidationResult validateAndCalculate(String rawCode, BigDecimal subtotal) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new BadRequestException("Coupon code is required");
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(rawCode.trim())
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new BadRequestException("This coupon is currently inactive");
        }
        if (coupon.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("This coupon has expired");
        }
        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new BadRequestException("This coupon has reached its usage limit");
        }
        if (subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
            throw new BadRequestException("Minimum order value of ₹" + coupon.getMinOrderValue() + " required for this coupon");
        }

        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return new CouponValidationResult(coupon, discount.setScale(2, RoundingMode.HALF_UP));
    }

    @Transactional
    public void incrementUsage(Coupon coupon) {
        if (coupon == null) {
            return;
        }
        coupon.setUsedCount(coupon.getUsedCount() + 1);
        couponRepository.save(coupon);
    }

    private void validateCouponRequest(CouponRequest request) {
        if (request.discountType() == DiscountType.PERCENTAGE
                && request.discountValue().compareTo(new BigDecimal("100")) > 0) {
            throw new BadRequestException("Percentage discount cannot exceed 100%");
        }
    }

    private void applyFields(Coupon coupon, CouponRequest request) {
        coupon.setDescription(request.description() == null || request.description().isBlank()
                ? null : request.description().trim());
        coupon.setDiscountType(request.discountType());
        coupon.setDiscountValue(request.discountValue());
        coupon.setMinOrderValue(request.minOrderValue() != null ? request.minOrderValue() : BigDecimal.ZERO.setScale(2));
        coupon.setMaxDiscount(request.maxDiscount());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setExpiresAt(request.expiresAt());
        if (request.active() != null) {
            coupon.setActive(request.active());
        }
    }
}
