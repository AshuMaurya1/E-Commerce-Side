package com.shopsphere.product.dto;

import com.shopsphere.product.Product;
import com.shopsphere.product.ProductImage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ProductDtos {

    private ProductDtos() {}

    public record ProductImageRequest(
            @NotBlank(message = "Image URL is required")
            @Size(max = 600)
            String imageUrl,

            @Size(max = 200)
            String altText,

            boolean primaryImage,

            @Min(0)
            int sortOrder
    ) {}

    public record ProductImageResponse(
            Long id,
            String imageUrl,
            String altText,
            boolean primaryImage,
            int sortOrder
    ) {
        public static ProductImageResponse from(ProductImage image) {
            return new ProductImageResponse(
                    image.getId(),
                    image.getImageUrl(),
                    image.getAltText(),
                    image.isPrimaryImage(),
                    image.getSortOrder()
            );
        }
    }

    public record ProductRequest(
            @NotNull(message = "Category is required")
            Long categoryId,

            @NotBlank(message = "Product name is required")
            @Size(min = 2, max = 200)
            String name,

            @Size(max = 220)
            String slug,

            @NotBlank(message = "SKU is required")
            @Size(min = 2, max = 64)
            String sku,

            @Size(max = 100)
            String brand,

            @Size(max = 320)
            String shortDescription,

            @NotBlank(message = "Product description is required")
            String description,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.01", message = "Price must be greater than zero")
            BigDecimal price,

            @DecimalMin(value = "0.01", message = "Discount price must be greater than zero")
            BigDecimal discountPrice,

            @NotNull(message = "Stock quantity is required")
            @Min(value = 0, message = "Stock quantity cannot be negative")
            Integer stockQuantity,

            @Min(value = 0, message = "Low stock threshold cannot be negative")
            Integer lowStockThreshold,

            boolean featured,
            boolean trending,
            Boolean active,

            @Valid
            List<ProductImageRequest> images
    ) {}

    public record ProductSummaryResponse(
            Long id,
            String name,
            String slug,
            String sku,
            String brand,
            String shortDescription,
            BigDecimal price,
            BigDecimal discountPrice,
            BigDecimal effectivePrice,
            int stockQuantity,
            int lowStockThreshold,
            boolean inStock,
            boolean featured,
            boolean trending,
            boolean active,
            BigDecimal averageRating,
            int reviewCount,
            int soldCount,
            Long categoryId,
            String categoryName,
            String categorySlug,
            String primaryImageUrl,
            Instant createdAt
    ) {
        public static ProductSummaryResponse from(Product product) {
            return new ProductSummaryResponse(
                    product.getId(),
                    product.getName(),
                    product.getSlug(),
                    product.getSku(),
                    product.getBrand(),
                    product.getShortDescription(),
                    product.getPrice(),
                    product.getDiscountPrice(),
                    product.getEffectivePrice(),
                    product.getStockQuantity(),
                    product.getLowStockThreshold(),
                    product.getStockQuantity() > 0,
                    product.isFeatured(),
                    product.isTrending(),
                    product.isActive(),
                    product.getAverageRating(),
                    product.getReviewCount(),
                    product.getSoldCount(),
                    product.getCategory().getId(),
                    product.getCategory().getName(),
                    product.getCategory().getSlug(),
                    product.getPrimaryImageUrl(),
                    product.getCreatedAt()
            );
        }
    }

    public record ProductDetailResponse(
            Long id,
            String name,
            String slug,
            String sku,
            String brand,
            String shortDescription,
            String description,
            BigDecimal price,
            BigDecimal discountPrice,
            BigDecimal effectivePrice,
            int stockQuantity,
            int lowStockThreshold,
            boolean inStock,
            boolean featured,
            boolean trending,
            boolean active,
            BigDecimal averageRating,
            int reviewCount,
            int soldCount,
            Long categoryId,
            String categoryName,
            String categorySlug,
            List<ProductImageResponse> images,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static ProductDetailResponse from(Product product) {
            return new ProductDetailResponse(
                    product.getId(),
                    product.getName(),
                    product.getSlug(),
                    product.getSku(),
                    product.getBrand(),
                    product.getShortDescription(),
                    product.getDescription(),
                    product.getPrice(),
                    product.getDiscountPrice(),
                    product.getEffectivePrice(),
                    product.getStockQuantity(),
                    product.getLowStockThreshold(),
                    product.getStockQuantity() > 0,
                    product.isFeatured(),
                    product.isTrending(),
                    product.isActive(),
                    product.getAverageRating(),
                    product.getReviewCount(),
                    product.getSoldCount(),
                    product.getCategory().getId(),
                    product.getCategory().getName(),
                    product.getCategory().getSlug(),
                    product.getImages().stream().map(ProductImageResponse::from).toList(),
                    product.getCreatedAt(),
                    product.getUpdatedAt()
            );
        }
    }
}
