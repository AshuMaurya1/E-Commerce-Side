package com.shopsphere.inventory;

import com.shopsphere.common.PagedResponse;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.inventory.dto.InventoryDtos.AdjustInventoryRequest;
import com.shopsphere.inventory.dto.InventoryDtos.InventoryLogResponse;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;

    public InventoryService(ProductRepository productRepository, InventoryLogRepository inventoryLogRepository) {
        this.productRepository = productRepository;
        this.inventoryLogRepository = inventoryLogRepository;
    }

    @Transactional
    public void recordInitialStock(Product product, Long actorUserId, String note) {
        if (product.getStockQuantity() <= 0) {
            return;
        }
        saveLog(product, null, actorUserId, InventoryActionType.INITIAL_SEED,
                product.getStockQuantity(), 0, product.getStockQuantity(), note);
    }

    @Transactional
    public ProductSummaryResponse adjustStock(AdjustInventoryRequest request, Long actorUserId) {
        if (request.quantityDelta() == 0) {
            throw new BadRequestException("Quantity adjustment must be non-zero");
        }
        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        int previousStock = product.getStockQuantity();
        int newStock = previousStock + request.quantityDelta();
        if (newStock < 0) {
            throw new BadRequestException("Resulting stock cannot be negative (available: " + previousStock + ")");
        }

        product.setStockQuantity(newStock);
        Product saved = productRepository.save(product);
        saveLog(saved, null, actorUserId, InventoryActionType.MANUAL_ADJUSTMENT,
                request.quantityDelta(), previousStock, newStock,
                request.note() != null && !request.note().isBlank() ? request.note().trim() : "Manual stock adjustment");
        return ProductSummaryResponse.from(saved);
    }

    @Transactional
    public void reserveStock(Long productId, int quantity, Long orderId, Long actorUserId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (!product.isActive()) {
            throw new BadRequestException(product.getName() + " is currently unavailable");
        }
        if (product.getStockQuantity() < quantity) {
            throw new BadRequestException("Insufficient stock for " + product.getName()
                    + " (available: " + product.getStockQuantity() + ")");
        }
        int previous = product.getStockQuantity();
        int next = previous - quantity;
        product.setStockQuantity(next);
        productRepository.save(product);
        saveLog(product, orderId, actorUserId, InventoryActionType.ORDER_RESERVE,
                -quantity, previous, next, "Reserved for order #" + orderId);
    }

    @Transactional
    public void restoreStock(Long productId, int quantity, Long orderId, Long actorUserId,
                             InventoryActionType actionType, String note) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        int previous = product.getStockQuantity();
        int next = previous + quantity;
        product.setStockQuantity(next);
        productRepository.save(product);
        saveLog(product, orderId, actorUserId, actionType, quantity, previous, next, note);
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> listLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(ProductSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<InventoryLogResponse> listLogs(Long productId, Pageable pageable) {
        Page<InventoryLog> page = productId != null
                ? inventoryLogRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                : inventoryLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PagedResponse.from(page.map(InventoryLogResponse::from));
    }

    private void saveLog(Product product, Long orderId, Long actorUserId, InventoryActionType actionType,
                         int delta, int previousStock, int newStock, String note) {
        InventoryLog log = new InventoryLog();
        log.setProduct(product);
        log.setOrderId(orderId);
        log.setActorUserId(actorUserId);
        log.setActionType(actionType);
        log.setQuantityDelta(delta);
        log.setPreviousStock(previousStock);
        log.setNewStock(newStock);
        log.setNote(note);
        inventoryLogRepository.save(log);
    }
}
