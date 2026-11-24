package com.shopsphere.admin;

import com.shopsphere.admin.dto.AdminDtos.AdminCustomerResponse;
import com.shopsphere.admin.dto.AdminDtos.AnalyticsResponse;
import com.shopsphere.admin.dto.AdminDtos.DailySalesPoint;
import com.shopsphere.admin.dto.AdminDtos.DashboardResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.order.Order;
import com.shopsphere.order.OrderRepository;
import com.shopsphere.order.OrderStatus;
import com.shopsphere.order.dto.OrderDtos.OrderSummaryResponse;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import com.shopsphere.user.Role;
import com.shopsphere.user.User;
import com.shopsphere.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public AdminDashboardService(
            OrderRepository orderRepository,
            UserRepository userRepository,
            ProductRepository productRepository
    ) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalProducts = productRepository.countByActiveTrue();
        long pendingOrders = orderRepository.countByStatusIn(List.of(
                OrderStatus.PENDING_PAYMENT, OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PACKED
        ));
        long lowStockCount = productRepository.countLowStockProducts();

        List<OrderSummaryResponse> recentOrders = orderRepository.findTopRecentOrders(PageRequest.of(0, 6))
                .stream()
                .map(OrderSummaryResponse::from)
                .toList();

        List<ProductSummaryResponse> topSelling = productRepository.findAll(
                        PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "soldCount", "reviewCount")))
                .stream()
                .map(ProductSummaryResponse::from)
                .toList();

        List<ProductSummaryResponse> lowStockProducts = productRepository.findLowStockProducts()
                .stream()
                .limit(6)
                .map(ProductSummaryResponse::from)
                .toList();

        List<DailySalesPoint> dailySales = buildDailySales(14);

        return new DashboardResponse(
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts,
                pendingOrders,
                lowStockCount,
                recentOrders,
                topSelling,
                lowStockProducts,
                dailySales
        );
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(int days) {
        int clampedDays = Math.min(Math.max(days, 7), 90);
        List<DailySalesPoint> trend = buildDailySales(clampedDays);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            long c = orderRepository.countByStatusIn(List.of(status));
            if (c > 0) {
                byStatus.put(status.name(), c);
            }
        }

        List<ProductSummaryResponse> topProducts = productRepository.findAll(
                        PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "soldCount")))
                .stream()
                .map(ProductSummaryResponse::from)
                .toList();

        return new AnalyticsResponse(trend, byStatus, topProducts);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminCustomerResponse> listCustomers(String search, Pageable pageable) {
        Page<User> users = userRepository.searchByRole(Role.CUSTOMER, search, pageable);
        return PagedResponse.from(users.map(u -> new AdminCustomerResponse(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.getPhone(),
                u.isActive(),
                orderRepository.findByUserIdOrderByCreatedAtDesc(u.getId(), PageRequest.of(0, 1)).getTotalElements(),
                u.getCreatedAt()
        )));
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderSummaryResponse> listCustomerOrders(Long customerId, Pageable pageable) {
        if (!userRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer not found");
        }
        return PagedResponse.from(
                orderRepository.findByUserIdOrderByCreatedAtDesc(customerId, pageable).map(OrderSummaryResponse::from)
        );
    }

    @Transactional
    public AdminCustomerResponse setCustomerActive(Long customerId, boolean active) {
        User user = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot modify administrator status via customer endpoint");
        }
        user.setActive(active);
        User saved = userRepository.save(user);
        long orderCount = orderRepository.findByUserIdOrderByCreatedAtDesc(saved.getId(), PageRequest.of(0, 1))
                .getTotalElements();
        return new AdminCustomerResponse(
                saved.getId(), saved.getFullName(), saved.getEmail(),
                saved.getPhone(), saved.isActive(), orderCount, saved.getCreatedAt()
        );
    }

    private List<DailySalesPoint> buildDailySales(int days) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate start = today.minusDays(days - 1L);
        Instant since = start.atStartOfDay().toInstant(ZoneOffset.UTC);

        Map<LocalDate, BigDecimal> revenueByDate = new LinkedHashMap<>();
        Map<LocalDate, Long> countByDate = new LinkedHashMap<>();
        for (int i = 0; i < days; i++) {
            LocalDate d = start.plusDays(i);
            revenueByDate.put(d, BigDecimal.ZERO);
            countByDate.put(d, 0L);
        }

        List<Order> orders = orderRepository.findOrdersSince(since);
        for (Order o : orders) {
            LocalDate d = o.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate();
            if (revenueByDate.containsKey(d)) {
                revenueByDate.put(d, revenueByDate.get(d).add(o.getTotalAmount()));
                countByDate.put(d, countByDate.get(d) + 1);
            }
        }

        List<DailySalesPoint> points = new ArrayList<>(days);
        for (LocalDate d : revenueByDate.keySet()) {
            points.add(new DailySalesPoint(d.toString(), revenueByDate.get(d), countByDate.get(d)));
        }
        return points;
    }
}
