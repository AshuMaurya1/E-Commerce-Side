package com.shopsphere.review;

import com.shopsphere.common.PagedResponse;
import com.shopsphere.common.exception.ConflictException;
import com.shopsphere.common.exception.ForbiddenException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.review.dto.ReviewDtos.CreateReviewRequest;
import com.shopsphere.review.dto.ReviewDtos.ReviewResponse;
import com.shopsphere.user.User;
import com.shopsphere.user.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    public ReviewService(
            ReviewRepository reviewRepository,
            ProductRepository productRepository,
            UserService userService
    ) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> listProductReviews(Long productId, Pageable pageable) {
        return PagedResponse.from(
                reviewRepository.findByProductIdAndApprovedTrueOrderByCreatedAtDesc(productId, pageable)
                        .map(ReviewResponse::from)
        );
    }

    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest request, boolean verifiedPurchase) {
        Product product = productRepository.findByIdAndActiveTrue(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        if (reviewRepository.existsByProductIdAndUserId(product.getId(), userId)) {
            throw new ConflictException("You have already reviewed this product");
        }

        User user = userService.getActiveUser(userId);
        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(request.rating());
        review.setTitle(request.title() == null || request.title().isBlank() ? null : request.title().trim());
        review.setComment(request.comment().trim());
        review.setVerifiedPurchase(verifiedPurchase);
        review.setApproved(true);

        Review saved = reviewRepository.save(review);
        refreshProductRating(product.getId());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public void deleteOwnReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own reviews");
        }
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        refreshProductRating(productId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewResponse> listAdminReviews(Boolean approved, Pageable pageable) {
        Page<Review> page = approved == null
                ? reviewRepository.findAllByOrderByCreatedAtDesc(pageable)
                : reviewRepository.findByApprovedOrderByCreatedAtDesc(approved, pageable);
        return PagedResponse.from(page.map(ReviewResponse::from));
    }

    @Transactional
    public ReviewResponse setApproval(Long reviewId, boolean approved) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        review.setApproved(approved);
        Review saved = reviewRepository.save(review);
        refreshProductRating(review.getProduct().getId());
        return ReviewResponse.from(saved);
    }

    @Transactional
    public void deleteAdminReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        refreshProductRating(productId);
    }

    private void refreshProductRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        List<Object[]> stats = reviewRepository.getApprovedStatsForProduct(productId);
        if (stats.isEmpty() || stats.get(0)[0] == null) {
            product.setAverageRating(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            product.setReviewCount(0);
        } else {
            Double avg = ((Number) stats.get(0)[0]).doubleValue();
            int count = ((Number) stats.get(0)[1]).intValue();
            product.setAverageRating(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
            product.setReviewCount(count);
        }
        productRepository.save(product);
    }
}
