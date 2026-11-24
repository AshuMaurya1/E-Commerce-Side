package com.shopsphere.order.dto;

import com.shopsphere.order.Order;
import com.shopsphere.order.OrderItem;
import com.shopsphere.order.OrderPaymentStatus;
import com.shopsphere.order.OrderStatus;
import com.shopsphere.order.OrderStatusHistory;
import com.shopsphere.order.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {}

    public record CheckoutItemRequest(
            @NotNull Long productId,
            @Min(1) int quantity
    ) {}

    public record PlaceOrderRequest(
            @NotNull(message = "Delivery address is required")
            Long addressId,

            @NotNull(message = "Payment method is required")
            PaymentMethod paymentMethod,

            @Size(max = 50)
            String couponCode,

            @Size(max = 500)
            String customerNote,

            @Valid
            List<CheckoutItemRequest> directItems
    ) {}

    public record CancelOrderRequest(
            @NotBlank(message = "Cancellation reason is required")
            @Size(min = 3, max = 500)
            String reason
    ) {}

    public record ReturnOrderRequest(
            @NotBlank(message = "Return reason is required")
            @Size(min = 5, max = 500)
            String reason
    ) {}

    public record UpdateOrderStatusRequest(
            @NotNull(message = "Target status is required")
            OrderStatus status,

            @Size(max = 400)
            String note
    ) {}

    public record OrderItemResponse(
            Long id,
            Long productId,
            String productName,
            String productSku,
            String productImageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal
    ) {
        public static OrderItemResponse from(OrderItem item) {
            return new OrderItemResponse(
                    item.getId(),
                    item.getProduct().getId(),
                    item.getProductNameSnapshot(),
                    item.getProductSkuSnapshot(),
                    item.getProductImageSnapshot(),
                    item.getUnitPriceSnapshot(),
                    item.getQuantity(),
                    item.getLineTotal()
            );
        }
    }

    public record OrderStatusHistoryResponse(
            Long id,
            OrderStatus fromStatus,
            OrderStatus toStatus,
            Long changedByUserId,
            String note,
            Instant createdAt
    ) {
        public static OrderStatusHistoryResponse from(OrderStatusHistory h) {
            return new OrderStatusHistoryResponse(
                    h.getId(),
                    h.getFromStatus(),
                    h.getToStatus(),
                    h.getChangedByUserId(),
                    h.getNote(),
                    h.getCreatedAt()
            );
        }
    }

    public record OrderSummaryResponse(
            Long id,
            String orderNumber,
            Long customerId,
            String customerName,
            String customerEmail,
            OrderStatus status,
            PaymentMethod paymentMethod,
            OrderPaymentStatus paymentStatus,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal shippingFee,
            BigDecimal totalAmount,
            int itemCount,
            Instant createdAt
    ) {
        public static OrderSummaryResponse from(Order order) {
            int count = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
            return new OrderSummaryResponse(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getUser().getId(),
                    order.getUser().getFullName(),
                    order.getUser().getEmail(),
                    order.getStatus(),
                    order.getPaymentMethod(),
                    order.getPaymentStatus(),
                    order.getSubtotal(),
                    order.getDiscountAmount(),
                    order.getShippingFee(),
                    order.getTotalAmount(),
                    count,
                    order.getCreatedAt()
            );
        }
    }

    public record OrderDetailResponse(
            Long id,
            String orderNumber,
            Long customerId,
            String customerName,
            String customerEmail,
            OrderStatus status,
            PaymentMethod paymentMethod,
            OrderPaymentStatus paymentStatus,
            String couponCode,
            BigDecimal subtotal,
            BigDecimal discountAmount,
            BigDecimal shippingFee,
            BigDecimal totalAmount,
            String shippingRecipient,
            String shippingPhone,
            String shippingLine1,
            String shippingLine2,
            String shippingCity,
            String shippingState,
            String shippingPostalCode,
            String shippingCountry,
            String customerNote,
            String cancellationReason,
            String returnReason,
            boolean inventoryReserved,
            Instant expiresAt,
            List<OrderItemResponse> items,
            List<OrderStatusHistoryResponse> statusHistory,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static OrderDetailResponse from(Order order) {
            return new OrderDetailResponse(
                    order.getId(),
                    order.getOrderNumber(),
                    order.getUser().getId(),
                    order.getUser().getFullName(),
                    order.getUser().getEmail(),
                    order.getStatus(),
                    order.getPaymentMethod(),
                    order.getPaymentStatus(),
                    order.getCouponCode(),
                    order.getSubtotal(),
                    order.getDiscountAmount(),
                    order.getShippingFee(),
                    order.getTotalAmount(),
                    order.getShippingRecipient(),
                    order.getShippingPhone(),
                    order.getShippingLine1(),
                    order.getShippingLine2(),
                    order.getShippingCity(),
                    order.getShippingState(),
                    order.getShippingPostalCode(),
                    order.getShippingCountry(),
                    order.getCustomerNote(),
                    order.getCancellationReason(),
                    order.getReturnReason(),
                    order.isInventoryReserved(),
                    order.getExpiresAt(),
                    order.getItems().stream().map(OrderItemResponse::from).toList(),
                    order.getStatusHistory().stream().map(OrderStatusHistoryResponse::from).toList(),
                    order.getCreatedAt(),
                    order.getUpdatedAt()
            );
        }
    }
}
