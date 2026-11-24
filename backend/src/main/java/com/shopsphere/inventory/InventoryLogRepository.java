package com.shopsphere.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {

    @EntityGraph(attributePaths = {"product"})
    Page<InventoryLog> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    @EntityGraph(attributePaths = {"product"})
    Page<InventoryLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
