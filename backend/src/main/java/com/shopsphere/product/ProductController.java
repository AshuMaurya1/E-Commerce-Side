package com.shopsphere.product;

import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.product.dto.ProductDtos.ProductDetailResponse;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductSummaryResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean trending,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(productService.listPublicProducts(
                search, category, minPrice, maxPrice, featured, trending, inStock, sort, page, size)));
    }

    @GetMapping("/{slugOrId}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> detail(@PathVariable String slugOrId) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getPublicProduct(slugOrId)));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> related(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getRelatedProducts(id)));
    }
}
