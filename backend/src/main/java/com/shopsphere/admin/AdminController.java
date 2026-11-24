package com.shopsphere.admin;

import com.shopsphere.admin.dto.AdminDtos.AdminCustomerResponse;
import com.shopsphere.admin.dto.AdminDtos.AnalyticsResponse;
import com.shopsphere.admin.dto.AdminDtos.DashboardResponse;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminDashboardService dashboardService;

    public AdminController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDashboard()));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> analytics(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAnalytics(days)));
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<PagedResponse<AdminCustomerResponse>>> customers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.listCustomers(search,
                        PageRequest.of(Math.max(page, 0), Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt")))));
    }

    @GetMapping("/customers/{id}/orders")
    public ResponseEntity<ApiResponse<PagedResponse<OrderSummaryResponse>>> customerOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                dashboardService.listCustomerOrders(id, PageRequest.of(Math.max(page, 0), Math.min(size, 50)))));
    }

    @PatchMapping("/customers/{id}/status")
    public ResponseEntity<ApiResponse<AdminCustomerResponse>> toggleCustomerStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        boolean active = Boolean.TRUE.equals(body.get("active"));
        return ResponseEntity.ok(ApiResponse.ok("Customer status updated",
                dashboardService.setCustomerActive(id, active)));
    }
}
