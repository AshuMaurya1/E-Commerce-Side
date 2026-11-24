package com.shopsphere.admin.dto;

import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AdminDtos {

    private AdminDtos() {}

    public record DailySalesPoint(
            String date,
            BigDecimal revenue,
            long orders
    ) {}

    public record DashboardResponse(
            BigDecimal totalRevenue,
            long totalOrders,
            long totalCustomers,
            long totalProducts,
            long pendingOrders,
            long lowStockCount,
            List<OrderSummaryResponse> recentOrders,
            List<ProductSummaryResponse> topSellingProducts,
            List<ProductSummaryResponse> lowStockProducts,
            List<DailySalesPoint> dailySales
    ) {}

    public record AnalyticsResponse(
            List<DailySalesPoint> salesTrend,
            Map<String, Long> ordersByStatus,
            List<ProductSummaryResponse> topProducts
    ) {}

    public record AdminCustomerResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            boolean active,
            long totalOrders,
            java.time.Instant createdAt
    ) {}
}
