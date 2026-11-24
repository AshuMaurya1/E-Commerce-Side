package com.shopsphere.inventory.dto;

import com.shopsphere.inventory.InventoryActionType;
import com.shopsphere.inventory.InventoryLog;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class InventoryDtos {

    private InventoryDtos() {}

    public record AdjustInventoryRequest(
            @NotNull(message = "Product ID is required")
            Long productId,

            @NotNull(message = "Quantity delta is required")
            Integer quantityDelta,

            @Size(max = 300)
            String note
    ) {}

    public record InventoryLogResponse(
            Long id,
            Long productId,
            String productName,
            String productSku,
            Long orderId,
            Long actorUserId,
            InventoryActionType actionType,
            int quantityDelta,
            int previousStock,
            int newStock,
            String note,
            Instant createdAt
    ) {
        public static InventoryLogResponse from(InventoryLog log) {
            return new InventoryLogResponse(
                    log.getId(),
                    log.getProduct().getId(),
                    log.getProduct().getName(),
                    log.getProduct().getSku(),
                    log.getOrderId(),
                    log.getActorUserId(),
                    log.getActionType(),
                    log.getQuantityDelta(),
                    log.getPreviousStock(),
                    log.getNewStock(),
                    log.getNote(),
                    log.getCreatedAt()
            );
        }
    }
}
