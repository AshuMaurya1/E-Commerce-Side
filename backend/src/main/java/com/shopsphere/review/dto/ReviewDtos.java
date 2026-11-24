package com.shopsphere.review.dto;

import com.shopsphere.review.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ReviewDtos {

    private ReviewDtos() {}

    public record CreateReviewRequest(
            @NotNull(message = "Product ID is required")
            Long productId,

            @Min(value = 1, message = "Rating must be between 1 and 5")
            @Max(value = 5, message = "Rating must be between 1 and 5")
            int rating,

            @Size(max = 160)
            String title,

            @NotBlank(message = "Review comment is required")
            @Size(min = 5, max = 2000)
            String comment
    ) {}

    public record ReviewResponse(
            Long id,
            Long productId,
            String productName,
            Long userId,
            String reviewerName,
            int rating,
            String title,
            String comment,
            boolean verifiedPurchase,
            boolean approved,
            Instant createdAt
    ) {
        public static ReviewResponse from(Review review) {
            return new ReviewResponse(
                    review.getId(),
                    review.getProduct().getId(),
                    review.getProduct().getName(),
                    review.getUser().getId(),
                    review.getUser().getFullName(),
                    review.getRating(),
                    review.getTitle(),
                    review.getComment(),
                    review.isVerifiedPurchase(),
                    review.isApproved(),
                    review.getCreatedAt()
            );
        }
    }
}
