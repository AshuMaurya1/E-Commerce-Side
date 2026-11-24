package com.shopsphere.review;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByProductIdAndUserId(Long productId, Long userId);

    @EntityGraph(attributePaths = {"user"})
    Page<Review> findByProductIdAndApprovedTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "product"})
    Page<Review> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "product"})
    Page<Review> findByApprovedOrderByCreatedAtDesc(boolean approved, Pageable pageable);

    @Query("SELECT AVG(r.rating), COUNT(r) FROM Review r WHERE r.product.id = :productId AND r.approved = true")
    List<Object[]> getApprovedStatsForProduct(@Param("productId") Long productId);
}
