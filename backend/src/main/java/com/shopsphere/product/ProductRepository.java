package com.shopsphere.product;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @EntityGraph(attributePaths = {"category", "images"})
    Optional<Product> findBySlugAndActiveTrue(String slug);

    @EntityGraph(attributePaths = {"category", "images"})
    Optional<Product> findByIdAndActiveTrue(Long id);

    @EntityGraph(attributePaths = {"category", "images"})
    Optional<Product> findWithDetailsById(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    boolean existsBySlug(String slug);

    boolean existsBySkuIgnoreCase(String sku);

    long countByCategoryId(Long categoryId);

    long countByActiveTrue();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.stockQuantity <= p.lowStockThreshold")
    long countLowStockProducts();

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true AND p.stockQuantity <= p.lowStockThreshold
            ORDER BY p.stockQuantity ASC, p.name ASC
            """)
    List<Product> findLowStockProducts();

    @EntityGraph(attributePaths = {"category", "images"})
    List<Product> findTop6ByCategoryIdAndActiveTrueAndIdNotOrderBySoldCountDesc(Long categoryId, Long id);

    @EntityGraph(attributePaths = {"category", "images"})
    List<Product> findByIdIn(Collection<Long> ids);

    @Query("""
            SELECT p.category.id, COUNT(p)
            FROM Product p
            WHERE p.active = true
            GROUP BY p.category.id
            """)
    List<Object[]> countActiveProductsByCategory();

    @Query(
            value = """
            SELECT p FROM Product p
            LEFT JOIN FETCH p.category
            WHERE (:search IS NULL OR :search = ''
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:active IS NULL OR p.active = :active)
              AND (:lowStockOnly = false OR p.stockQuantity <= p.lowStockThreshold)
            """,
            countQuery = """
            SELECT COUNT(p) FROM Product p
            WHERE (:search IS NULL OR :search = ''
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:active IS NULL OR p.active = :active)
              AND (:lowStockOnly = false OR p.stockQuantity <= p.lowStockThreshold)
            """
    )
    Page<Product> searchAdminProducts(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("active") Boolean active,
            @Param("lowStockOnly") boolean lowStockOnly,
            Pageable pageable
    );
}
