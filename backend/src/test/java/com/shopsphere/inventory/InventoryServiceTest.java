package com.shopsphere.inventory;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.shopsphere.category.Category;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.inventory.dto.InventoryDtos.AdjustInventoryRequest;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InventoryLogRepository inventoryLogRepository;

    private InventoryService service() {
        return new InventoryService(productRepository, inventoryLogRepository);
    }

    private Product product(int stock, boolean active) {
        Product product = new Product();
        product.setId(10L);
        product.setName("Wireless Headphones");
        product.setSku("SS-WH-10");
        product.setStockQuantity(stock);
        product.setActive(active);
        product.setPrice(new java.math.BigDecimal("100.00"));
        product.setDescription("Test product");
        product.setSlug("wireless-headphones");
        Category category = new Category();
        category.setId(5L);
        category.setName("Electronics");
        category.setSlug("electronics");
        product.setCategory(category);
        return product;
    }

    @Test
    void rejectsZeroStockAdjustment() {
        assertThrows(BadRequestException.class,
                () -> service().adjustStock(new AdjustInventoryRequest(10L, 0, null), 1L));
    }

    @Test
    void rejectsAdjustmentThatWouldCreateNegativeStock() {
        Product product = product(5, true);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class,
                () -> service().adjustStock(new AdjustInventoryRequest(10L, -6, null), 1L));
    }

    @Test
    void adjustsStockAndCreatesInventoryLog() {
        Product product = product(5, true);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);

        var response = service().adjustStock(new AdjustInventoryRequest(10L, 3, "Restocked"), 1L);

        assertEquals(8, response.stockQuantity());
        verify(productRepository).save(product);
        verify(inventoryLogRepository).save(any(InventoryLog.class));
    }

    @Test
    void reserveStockRejectsInactiveProduct() {
        Product product = product(5, false);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class,
                () -> service().reserveStock(10L, 1, 20L, 1L));
    }

    @Test
    void reserveStockRejectsInsufficientQuantity() {
        Product product = product(2, true);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        assertThrows(BadRequestException.class,
                () -> service().reserveStock(10L, 3, 20L, 1L));
    }

    @Test
    void reserveStockDecrementsQuantityAndCreatesLog() {
        Product product = product(5, true);
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product));

        service().reserveStock(10L, 2, 20L, 1L);

        assertEquals(3, product.getStockQuantity());
        verify(productRepository).save(product);
        verify(inventoryLogRepository).save(any(InventoryLog.class));
    }
}
