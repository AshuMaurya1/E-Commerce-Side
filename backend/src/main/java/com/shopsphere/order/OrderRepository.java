package com.shopsphere.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"user"})
    Optional<Order> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = {"user"})
    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    @EntityGraph(attributePaths = {"user"})
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query(
            value = """
            SELECT o FROM Order o
            JOIN FETCH o.user
            WHERE (:status IS NULL OR o.status = :status)
              AND (:search IS NULL OR :search = ''
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.shippingRecipient) LIKE LOWER(CONCAT('%', :search, '%')))
            """,
            countQuery = """
            SELECT COUNT(o) FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:search IS NULL OR :search = ''
                   OR LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.user.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(o.shippingRecipient) LIKE LOWER(CONCAT('%', :search, '%')))
            """
    )
    Page<Order> searchAdminOrders(
            @Param("status") OrderStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    List<Order> findByStatusAndInventoryReservedTrueAndExpiresAtBefore(OrderStatus status, Instant cutoff);

    long countByStatusIn(Collection<OrderStatus> statuses);

    @Query("""
            SELECT COALESCE(SUM(o.totalAmount), 0)
            FROM Order o
            WHERE o.paymentStatus = com.shopsphere.order.OrderPaymentStatus.PAID
               OR (o.paymentMethod = com.shopsphere.order.PaymentMethod.COD
                   AND o.status = com.shopsphere.order.OrderStatus.DELIVERED)
            """)
    BigDecimal calculateTotalRevenue();

    @Query("SELECT o FROM Order o JOIN FETCH o.user ORDER BY o.createdAt DESC")
    List<Order> findTopRecentOrders(Pageable pageable);

    @Query("""
            SELECT o FROM Order o
            WHERE o.createdAt >= :since
              AND o.status <> com.shopsphere.order.OrderStatus.CANCELLED
            ORDER BY o.createdAt ASC
            """)
    List<Order> findOrdersSince(@Param("since") Instant since);

    @Query("""
            SELECT COUNT(oi) > 0
            FROM OrderItem oi
            WHERE oi.order.user.id = :userId
              AND oi.product.id = :productId
              AND oi.order.status IN (
                  com.shopsphere.order.OrderStatus.PLACED,
                  com.shopsphere.order.OrderStatus.CONFIRMED,
                  com.shopsphere.order.OrderStatus.PACKED,
                  com.shopsphere.order.OrderStatus.SHIPPED,
                  com.shopsphere.order.OrderStatus.DELIVERED
              )
            """)
    boolean hasUserPurchasedProduct(@Param("userId") Long userId, @Param("productId") Long productId);
}
