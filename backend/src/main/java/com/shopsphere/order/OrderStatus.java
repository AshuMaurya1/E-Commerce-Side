package com.shopsphere.order;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    PENDING_PAYMENT,
    PLACED,
    CONFIRMED,
    PACKED,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    RETURN_REQUESTED,
    RETURNED,
    REFUNDED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(PENDING_PAYMENT, Set.of(PLACED, CANCELLED));
        ALLOWED_TRANSITIONS.put(PLACED, Set.of(CONFIRMED, CANCELLED));
        ALLOWED_TRANSITIONS.put(CONFIRMED, Set.of(PACKED, CANCELLED));
        ALLOWED_TRANSITIONS.put(PACKED, Set.of(SHIPPED, CANCELLED));
        ALLOWED_TRANSITIONS.put(SHIPPED, Set.of(DELIVERED));
        ALLOWED_TRANSITIONS.put(DELIVERED, Set.of(RETURN_REQUESTED));
        ALLOWED_TRANSITIONS.put(CANCELLED, Set.of(REFUNDED));
        ALLOWED_TRANSITIONS.put(RETURN_REQUESTED, Set.of(RETURNED, DELIVERED));
        ALLOWED_TRANSITIONS.put(RETURNED, Set.of(REFUNDED));
        ALLOWED_TRANSITIONS.put(REFUNDED, Set.of());
    }

    public boolean canTransitionTo(OrderStatus target) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }
}
