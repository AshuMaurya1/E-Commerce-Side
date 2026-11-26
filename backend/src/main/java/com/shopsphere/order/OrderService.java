package com.shopsphere.order;

import com.shopsphere.address.Address;
import com.shopsphere.address.AddressService;
import com.shopsphere.cart.Cart;
import com.shopsphere.cart.CartItem;
import com.shopsphere.cart.CartService;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.coupon.Coupon;
import com.shopsphere.coupon.CouponService;
import com.shopsphere.coupon.dto.CouponDtos.CouponValidationResult;
import com.shopsphere.inventory.InventoryActionType;
import com.shopsphere.inventory.InventoryService;
import com.shopsphere.order.dto.OrderDtos.CheckoutItemRequest;
import com.shopsphere.order.dto.OrderDtos.OrderDetailResponse;
import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import com.shopsphere.order.dto.OrderDtos.PlaceOrderRequest;
import com.shopsphere.order.dto.OrderDtos.UpdateOrderStatusRequest;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.review.ReviewController.VerifiedPurchaseChecker;
import com.shopsphere.user.User;
import com.shopsphere.user.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService implements VerifiedPurchaseChecker {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE = Set.of(
            OrderStatus.PENDING_PAYMENT, OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PACKED
    );

    private final OrderRepository orderRepository;
    private final UserService userService;
    private final AddressService addressService;
    private final CartService cartService;
    private final CouponService couponService;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public OrderService(
            OrderRepository orderRepository,
            UserService userService,
            AddressService addressService,
            CartService cartService,
            CouponService couponService,
            ProductRepository productRepository,
            InventoryService inventoryService
    ) {
        this.orderRepository = orderRepository;
        this.userService = userService;
        this.addressService = addressService;
        this.cartService = cartService;
        this.couponService = couponService;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPurchasedProduct(Long userId, Long productId) {
        return orderRepository.hasUserPurchasedProduct(userId, productId);
    }

    @Transactional
    public OrderDetailResponse placeOrder(Long userId, PlaceOrderRequest request) {
        User user = userService.getActiveUser(userId);
        Address address = addressService.getOwnedAddress(userId, request.addressId());

        boolean usingDirectItems = request.directItems() != null && !request.directItems().isEmpty();
        Map<Long, Integer> requestedQuantities = new LinkedHashMap<>();

        Cart cart = null;
        if (usingDirectItems) {
            for (CheckoutItemRequest item : request.directItems()) {
                requestedQuantities.merge(item.productId(), item.quantity(), Integer::sum);
            }
        } else {
            cart = cartService.getOrCreateCart(userId);
            if (cart.getItems().isEmpty()) {
                throw new BadRequestException("Your cart is empty");
            }
            for (CartItem item : cart.getItems()) {
                requestedQuantities.merge(item.getProduct().getId(), item.getQuantity(), Integer::sum);
            }
        }

        // Lock products in deterministic ID order to avoid deadlocks under concurrent checkouts
        List<Long> sortedProductIds = requestedQuantities.keySet().stream()
                .sorted(Comparator.naturalOrder())
                .toList();

        List<Product> lockedProducts = new ArrayList<>();
        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
            if (!product.isActive()) {
                throw new BadRequestException(product.getName() + " is no longer available");
            }
            int qty = requestedQuantities.get(productId);
            if (qty <= 0) {
                throw new BadRequestException("Invalid quantity for " + product.getName());
            }
            if (product.getStockQuantity() < qty) {
                throw new BadRequestException("Insufficient stock for " + product.getName()
                        + " (available: " + product.getStockQuantity() + ")");
            }
            lockedProducts.add(product);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Product product : lockedProducts) {
            int qty = requestedQuantities.get(product.getId());
            BigDecimal lineTotal = product.getEffectivePrice()
                    .multiply(BigDecimal.valueOf(qty))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        String effectiveCouponCode = request.couponCode() != null && !request.couponCode().isBlank()
                ? request.couponCode().trim()
                : (cart != null ? cart.getCouponCode() : null);

        Coupon appliedCoupon = null;
        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (effectiveCouponCode != null && !effectiveCouponCode.isBlank()) {
            CouponValidationResult couponResult = couponService.validateAndCalculate(effectiveCouponCode, subtotal);
            appliedCoupon = couponResult.coupon();
            discountAmount = couponResult.discountAmount();
        }

        BigDecimal afterDiscount = subtotal.subtract(discountAmount).max(BigDecimal.ZERO);
        BigDecimal shippingFee = cartService.calculateShippingFee(afterDiscount);
        BigDecimal totalAmount = afterDiscount.add(shippingFee).setScale(2, RoundingMode.HALF_UP);

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setUser(user);
        order.setCoupon(appliedCoupon);
        order.setCouponCode(appliedCoupon != null ? appliedCoupon.getCode() : null);
        order.setPaymentMethod(request.paymentMethod());

        boolean isCod = request.paymentMethod() == PaymentMethod.COD;
        order.setStatus(isCod ? OrderStatus.PLACED : OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(OrderPaymentStatus.PENDING);
        order.setExpiresAt(isCod ? null : Instant.now().plus(Duration.ofMinutes(15)));
        order.setSubtotal(subtotal);
        order.setDiscountAmount(discountAmount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(totalAmount);
        order.setShippingRecipient(address.getRecipientName());
        order.setShippingPhone(address.getPhone());
        order.setShippingLine1(address.getLine1());
        order.setShippingLine2(address.getLine2());
        order.setShippingCity(address.getCity());
        order.setShippingState(address.getState());
        order.setShippingPostalCode(address.getPostalCode());
        order.setShippingCountry(address.getCountry());
        order.setCustomerNote(request.customerNote() == null || request.customerNote().isBlank()
                ? null : request.customerNote().trim());
        order.setInventoryReserved(true);

        for (Product product : lockedProducts) {
            int qty = requestedQuantities.get(product.getId());
            BigDecimal unitPrice = product.getEffectivePrice().setScale(2, RoundingMode.HALF_UP);
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setProductNameSnapshot(product.getName());
            oi.setProductSkuSnapshot(product.getSku());
            oi.setProductImageSnapshot(product.getPrimaryImageUrl());
            oi.setUnitPriceSnapshot(unitPrice);
            oi.setQuantity(qty);
            oi.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP));
            order.getItems().add(oi);
        }

        Order saved = orderRepository.save(order);
        recordStatusHistory(saved, null, saved.getStatus(), userId,
                isCod ? "Order placed with Cash on Delivery" : "Order created awaiting online payment");

        for (Product product : lockedProducts) {
            int qty = requestedQuantities.get(product.getId());
            inventoryService.reserveStock(product.getId(), qty, saved.getId(), userId);
        }

        if (isCod && appliedCoupon != null) {
            couponService.incrementUsage(appliedCoupon);
        }

        if (!usingDirectItems) {
            cartService.clearCart(userId);
        }

        return OrderDetailResponse.from(orderRepository.save(saved));
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderSummaryResponse> listCustomerOrders(Long userId, Pageable pageable) {
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PagedResponse.from(page.map(OrderSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getCustomerOrder(Long userId, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        return OrderDetailResponse.from(order);
    }

    @Transactional
    public OrderDetailResponse cancelByCustomer(Long userId, String orderNumber, String reason) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        if (!CUSTOMER_CANCELLABLE.contains(order.getStatus())) {
            throw new BadRequestException("Order cannot be cancelled once it is " + order.getStatus());
        }

        OrderStatus previous = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason.trim());
        if (order.getPaymentStatus() == OrderPaymentStatus.PAID) {
            order.setPaymentStatus(OrderPaymentStatus.REFUND_PENDING);
        }

        restoreOrderInventoryIfReserved(order, userId,
                previous == OrderStatus.PENDING_PAYMENT
                        ? InventoryActionType.ORDER_RELEASE
                        : InventoryActionType.ORDER_CANCEL_RESTORE,
                "Cancelled by customer: " + reason.trim());

        recordStatusHistory(order, previous, OrderStatus.CANCELLED, userId, reason.trim());
        return OrderDetailResponse.from(orderRepository.save(order));
    }

    @Transactional
    public OrderDetailResponse requestReturn(Long userId, String orderNumber, String reason) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You do not have access to this order");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Return requests can only be submitted for delivered orders");
        }

        order.setStatus(OrderStatus.RETURN_REQUESTED);
        order.setReturnReason(reason.trim());
        recordStatusHistory(order, OrderStatus.DELIVERED, OrderStatus.RETURN_REQUESTED, userId, reason.trim());
        return OrderDetailResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderSummaryResponse> listAdminOrders(OrderStatus status, String search, Pageable pageable) {
        return PagedResponse.from(
                orderRepository.searchAdminOrders(status, search, pageable).map(OrderSummaryResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getAdminOrder(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return OrderDetailResponse.from(order);
    }

    @Transactional
    public OrderDetailResponse updateStatusByAdmin(String orderNumber, UpdateOrderStatusRequest request, Long adminId) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        OrderStatus from = order.getStatus();
        OrderStatus to = request.status();
        if (!from.canTransitionTo(to)) {
            throw new BadRequestException("Invalid order status transition from " + from + " to " + to);
        }

        if (to == OrderStatus.CANCELLED) {
            if (request.note() != null && !request.note().isBlank()) {
                order.setCancellationReason(request.note().trim());
            }
            if (order.getPaymentStatus() == OrderPaymentStatus.PAID) {
                order.setPaymentStatus(OrderPaymentStatus.REFUND_PENDING);
            }
            restoreOrderInventoryIfReserved(order, adminId,
                    from == OrderStatus.PENDING_PAYMENT
                            ? InventoryActionType.ORDER_RELEASE
                            : InventoryActionType.ORDER_CANCEL_RESTORE,
                    "Cancelled by admin");
        } else if (to == OrderStatus.RETURNED) {
            restoreOrderInventoryIfReserved(order, adminId, InventoryActionType.ORDER_RETURN_RESTORE,
                    "Returned to warehouse");
            if (order.getPaymentStatus() == OrderPaymentStatus.PAID) {
                order.setPaymentStatus(OrderPaymentStatus.REFUND_PENDING);
            }
        } else if (to == OrderStatus.REFUNDED) {
            if (order.getPaymentStatus() != OrderPaymentStatus.PAID
                    && order.getPaymentStatus() != OrderPaymentStatus.REFUND_PENDING) {
                throw new BadRequestException("Only paid or refund-pending orders can be marked refunded");
            }
            order.setPaymentStatus(OrderPaymentStatus.REFUNDED);
        } else if (to == OrderStatus.DELIVERED && order.getPaymentMethod() == PaymentMethod.COD) {
            order.setPaymentStatus(OrderPaymentStatus.PAID);
        }

        order.setStatus(to);
        recordStatusHistory(order, from, to, adminId,
                request.note() != null && !request.note().isBlank() ? request.note().trim() : "Status updated to " + to);

        return OrderDetailResponse.from(orderRepository.save(order));
    }

    @Transactional
    public void markOrderPaid(Order order, Long actorUserId, String note) {
        if (order.getStatus() == OrderStatus.PLACED && order.getPaymentStatus() == OrderPaymentStatus.PAID) {
            return;
        }
        OrderStatus from = order.getStatus();
        if (from == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.PLACED);
            order.setExpiresAt(null);
            recordStatusHistory(order, from, OrderStatus.PLACED, actorUserId, note);
        }
        order.setPaymentStatus(OrderPaymentStatus.PAID);

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setSoldCount(product.getSoldCount() + item.getQuantity());
            productRepository.save(product);
        }
        if (order.getCoupon() != null) {
            couponService.incrementUsage(order.getCoupon());
        }
        orderRepository.save(order);
    }

    @Transactional
    public void handleFailedPayment(Order order, String reason) {
        order.setPaymentStatus(OrderPaymentStatus.FAILED);
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancellationReason("Payment failed: " + reason);
            restoreOrderInventoryIfReserved(order, order.getUser().getId(),
                    InventoryActionType.ORDER_RELEASE, "Payment failed release");
            recordStatusHistory(order, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED,
                    null, "Payment failed: " + reason);
        }
        orderRepository.save(order);
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void releaseExpiredPendingOrders() {
        List<Order> expired = orderRepository.findByStatusAndInventoryReservedTrueAndExpiresAtBefore(
                OrderStatus.PENDING_PAYMENT, Instant.now());
        for (Order order : expired) {
            order.setStatus(OrderStatus.CANCELLED);
            order.setPaymentStatus(OrderPaymentStatus.FAILED);
            order.setCancellationReason("Payment window expired");
            restoreOrderInventoryIfReserved(order, null, InventoryActionType.ORDER_RELEASE,
                    "Expired unpaid order release");
            recordStatusHistory(order, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED,
                    null, "Automatically cancelled after payment timeout");
            orderRepository.save(order);
            log.info("Released inventory for expired order {}", order.getOrderNumber());
        }
    }

    private void restoreOrderInventoryIfReserved(Order order, Long actorUserId,
                                                 InventoryActionType actionType, String note) {
        if (!order.isInventoryReserved()) {
            return;
        }
        order.getItems().stream()
                .sorted(Comparator.comparing(oi -> oi.getProduct().getId()))
                .forEach(oi -> inventoryService.restoreStock(
                        oi.getProduct().getId(), oi.getQuantity(), order.getId(), actorUserId, actionType, note));
        order.setInventoryReserved(false);
    }

    private void recordStatusHistory(Order order, OrderStatus from, OrderStatus to, Long actorId, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedByUserId(actorId);
        history.setNote(note);
        order.getStatusHistory().add(history);
    }

    private String generateOrderNumber() {
        String datePart = DateTimeFormatter.BASIC_ISO_DATE.format(LocalDate.now());
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "SS-" + datePart + "-" + randomPart;
    }
}
