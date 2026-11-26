package com.shopsphere.coupon;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.coupon.dto.CouponDtos.CouponRequest;
import com.shopsphere.coupon.dto.CouponDtos.CouponValidationResult;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    private CouponService service() {
        return new CouponService(couponRepository);
    }

    private Coupon coupon(DiscountType type, String value, String expiresInDays) {
        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setCode("SAVE20");
        coupon.setActive(true);
        coupon.setDiscountType(type);
        coupon.setDiscountValue(new BigDecimal(value));
        coupon.setMinOrderValue(BigDecimal.ZERO);
        coupon.setExpiresAt(Instant.now().plus(Long.parseLong(expiresInDays), ChronoUnit.DAYS));
        coupon.setUsedCount(0);
        coupon.setUsageLimit(null);
        return coupon;
    }

    private CouponRequest request(String code, DiscountType type, String value) {
        return new CouponRequest(code, null, type, new BigDecimal(value), BigDecimal.ZERO,
                null, null, Instant.now().plus(10, ChronoUnit.DAYS), true);
    }

    @Test
    void createNormalizesCodeAndSavesCoupon() {
        CouponRequest request = request("  save20  ", DiscountType.PERCENTAGE, "20");
        when(couponRepository.existsByCodeIgnoreCase("SAVE20")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service().create(request);

        assertEquals("SAVE20", response.code());
        verify(couponRepository).save(any(Coupon.class));
    }

    @Test
    void createRejectsExistingCode() {
        when(couponRepository.existsByCodeIgnoreCase("SAVE20")).thenReturn(true);

        assertThrows(ConflictException.class,
                () -> service().create(request("save20", DiscountType.PERCENTAGE, "20")));
        verify(couponRepository, never()).save(any(Coupon.class));
    }

    @Test
    void updateReturnsNotFoundForUnknownCoupon() {
        when(couponRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service().update(99L, request("SAVE20", DiscountType.PERCENTAGE, "20")));
    }

    @Test
    void percentageCouponCappedByMaximumDiscount() {
        Coupon coupon = coupon(DiscountType.PERCENTAGE, "20", "10");
        coupon.setMaxDiscount(new BigDecimal("50.00"));
        when(couponRepository.findByCodeIgnoreCase("save20")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = service().validateAndCalculate(" save20 ", new BigDecimal("500.00"));

        assertEquals(new BigDecimal("50.00"), result.discountAmount());
    }

    @Test
    void fixedCouponCannotReduceSubtotalBelowZero() {
        Coupon coupon = coupon(DiscountType.FIXED, "800.00", "10");
        when(couponRepository.findByCodeIgnoreCase("SAVE20")).thenReturn(Optional.of(coupon));

        CouponValidationResult result = service().validateAndCalculate("SAVE20", new BigDecimal("500.00"));

        assertEquals(new BigDecimal("500.00"), result.discountAmount());
    }

    @Test
    void rejectsInactiveCoupon() {
        Coupon coupon = coupon(DiscountType.FIXED, "100", "10");
        coupon.setActive(false);
        when(couponRepository.findByCodeIgnoreCase("SAVE20")).thenReturn(Optional.of(coupon));

        assertThrows(BadRequestException.class,
                () -> service().validateAndCalculate("SAVE20", new BigDecimal("500.00")));
    }

    @Test
    void incrementUsageUpdatesAndSavesCoupon() {
        Coupon coupon = coupon(DiscountType.PERCENTAGE, "20", "10");

        service().incrementUsage(coupon);

        assertEquals(1, coupon.getUsedCount());
        verify(couponRepository).save(coupon);
    }
}
