package com.shopsphere.payment.dto;

import com.shopsphere.payment.Payment;
import com.shopsphere.payment.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record CreatePaymentOrderRequest(
            @NotBlank(message = "Order number is required")
            String orderNumber
    ) {}

    public record VerifyPaymentRequest(
            @NotBlank(message = "Order number is required")
            String orderNumber,

            @NotBlank(message = "Razorpay order ID is required")
            String razorpayOrderId,

            @NotBlank(message = "Razorpay payment ID is required")
            String razorpayPaymentId,

            @NotBlank(message = "Razorpay signature is required")
            String razorpaySignature
    ) {}

    public record PaymentFailureRequest(
            @NotBlank(message = "Order number is required")
            String orderNumber,

            String razorpayOrderId,
            String reason
    ) {}

    public record SimulatePaymentRequest(
            @NotBlank(message = "Order number is required")
            String orderNumber
    ) {}

    public record RazorpayOrderResponse(
            String orderNumber,
            String razorpayOrderId,
            long amountInPaise,
            String currency,
            String keyId,
            String mode
    ) {}

    public record PaymentResponse(
            Long id,
            String orderNumber,
            String provider,
            String razorpayOrderId,
            String razorpayPaymentId,
            BigDecimal amount,
            String currency,
            PaymentStatus status,
            String failureReason,
            String refundId,
            Instant paidAt,
            Instant createdAt
    ) {
        public static PaymentResponse from(Payment p) {
            return new PaymentResponse(
                    p.getId(),
                    p.getOrder().getOrderNumber(),
                    p.getProvider(),
                    p.getRazorpayOrderId(),
                    p.getRazorpayPaymentId(),
                    p.getAmount(),
                    p.getCurrency(),
                    p.getStatus(),
                    p.getFailureReason(),
                    p.getRefundId(),
                    p.getPaidAt(),
                    p.getCreatedAt()
            );
        }
    }
}
