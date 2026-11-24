package com.shopsphere.order;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.order.dto.OrderDtos.CancelOrderRequest;
import com.shopsphere.order.dto.OrderDtos.OrderDetailResponse;
import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import com.shopsphere.order.dto.OrderDtos.PlaceOrderRequest;
import com.shopsphere.order.dto.OrderDtos.ReturnOrderRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderDetailResponse>> placeOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Order placed", orderService.placeOrder(principal.getId(), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<OrderSummaryResponse>>> listMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.listCustomerOrders(principal.getId(), PageRequest.of(Math.max(page, 0), Math.min(size, 50)))));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getCustomerOrder(principal.getId(), orderNumber)));
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> cancelOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody CancelOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled",
                orderService.cancelByCustomer(principal.getId(), orderNumber, request.reason())));
    }

    @PostMapping("/{orderNumber}/return")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> returnOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String orderNumber,
            @Valid @RequestBody ReturnOrderRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Return requested",
                orderService.requestReturn(principal.getId(), orderNumber, request.reason())));
    }
}
