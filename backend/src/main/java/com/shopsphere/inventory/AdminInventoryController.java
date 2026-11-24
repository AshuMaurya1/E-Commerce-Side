package com.shopsphere.inventory;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.inventory.dto.InventoryDtos.AdjustInventoryRequest;
import com.shopsphere.inventory.dto.InventoryDtos.InventoryLogResponse;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/inventory")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> lowStock() {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.listLowStockProducts()));
    }

    @PostMapping("/adjust")
    public ResponseEntity<ApiResponse<ProductSummaryResponse>> adjust(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdjustInventoryRequest request
    ) {
        ProductSummaryResponse updated = inventoryService.adjustStock(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Inventory updated", updated));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<PagedResponse<InventoryLogResponse>>> logs(
            @RequestParam(required = false) Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        return ResponseEntity.ok(ApiResponse.ok(
                inventoryService.listLogs(productId, PageRequest.of(Math.max(page, 0), safeSize))));
    }
}
