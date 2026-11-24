package com.shopsphere.category.dto;

import com.shopsphere.category.Category;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class CategoryDtos {

    private CategoryDtos() {}

    public record CategoryRequest(
            @NotBlank(message = "Category name is required")
            @Size(min = 2, max = 120)
            String name,

            @Size(max = 140)
            String slug,

            @Size(max = 500)
            String description,

            @Size(max = 500)
            String imageUrl,

            Long parentId,

            @Min(0)
            Integer displayOrder,

            Boolean active
    ) {}

    public record CategoryResponse(
            Long id,
            String name,
            String slug,
            String description,
            String imageUrl,
            Long parentId,
            String parentName,
            boolean active,
            int displayOrder,
            long productCount,
            Instant createdAt
    ) {
        public static CategoryResponse from(Category category, long productCount) {
            return new CategoryResponse(
                    category.getId(),
                    category.getName(),
                    category.getSlug(),
                    category.getDescription(),
                    category.getImageUrl(),
                    category.getParent() != null ? category.getParent().getId() : null,
                    category.getParent() != null ? category.getParent().getName() : null,
                    category.isActive(),
                    category.getDisplayOrder(),
                    productCount,
                    category.getCreatedAt()
            );
        }
    }
}
