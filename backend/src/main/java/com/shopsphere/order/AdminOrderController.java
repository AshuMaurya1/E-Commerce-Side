package com.shopsphere.order;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.order.dto.OrderDtos.OrderDetailResponse;
import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import com.shopsphere.order.dto.OrderDtos.UpdateOrderStatusRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderSummaryResponse>>> listAll(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.listAdminOrders(status, search,
                        PageRequest.of(Math.max(page, 0), Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> detail(@PathVariable String orderNumber) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getAdminOrder(orderNumber)));
    }

    @PatchMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Order status updated",
                orderService.updateStatusByAdmin(orderNumber, request, principal.getId())));
    }
}
