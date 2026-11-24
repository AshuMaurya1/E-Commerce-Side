package com.shopsphere.review;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.PagedResponse;
import com.shopsphere.review.dto.ReviewDtos.CreateReviewRequest;
import com.shopsphere.review.dto.ReviewDtos.ReviewResponse;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReviewController {

    private final ReviewService reviewService;
    private final VerifiedPurchaseChecker verifiedPurchaseChecker;

    public interface VerifiedPurchaseChecker {
        boolean hasPurchasedProduct(Long userId, Long productId);
    }

    public ReviewController(
            ReviewService reviewService,
            VerifiedPurchaseChecker verifiedPurchaseChecker
    ) {
        this.reviewService = reviewService;
        this.verifiedPurchaseChecker = verifiedPurchaseChecker;
    }

    @GetMapping("/api/v1/reviews/product/{productId}")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> listForProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                reviewService.listProductReviews(productId, PageRequest.of(Math.max(page, 0), Math.min(size, 50)))));
    }

    @PostMapping("/api/v1/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        boolean verified = verifiedPurchaseChecker.hasPurchasedProduct(principal.getId(), request.productId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Review submitted",
                        reviewService.createReview(principal.getId(), request, verified)));
    }

    @DeleteMapping("/api/v1/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOwn(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        reviewService.deleteOwnReview(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Review deleted", null));
    }

    @GetMapping("/api/v1/admin/reviews")
    public ResponseEntity<ApiResponse<PagedResponse<ReviewResponse>>> adminList(
            @RequestParam(required = false) Boolean approved,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                reviewService.listAdminReviews(approved, PageRequest.of(Math.max(page, 0), Math.min(size, 100)))));
    }

    @PatchMapping("/api/v1/admin/reviews/{id}/approval")
    public ResponseEntity<ApiResponse<ReviewResponse>> setApproval(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        return ResponseEntity.ok(ApiResponse.ok("Review moderation updated",
                reviewService.setApproval(id, approved)));
    }

    @DeleteMapping("/api/v1/admin/reviews/{id}")
    public ResponseEntity<ApiResponse<Void>> adminDelete(@PathVariable Long id) {
        reviewService.deleteAdminReview(id);
        return ResponseEntity.ok(ApiResponse.ok("Review removed", null));
    }
}
