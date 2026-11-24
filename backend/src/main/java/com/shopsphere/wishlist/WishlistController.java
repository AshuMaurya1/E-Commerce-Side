package com.shopsphere.wishlist;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.common.ApiResponse;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.product.dto.ProductDtos.ProductSummaryResponse;
import com.shopsphere.user.UserService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Service
class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserService userService;

    WishlistService(WishlistRepository wishlistRepository, ProductRepository productRepository, UserService userService) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
        this.userService = userService;
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> list(Long userId) {
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(WishlistItem::getProduct)
                .filter(Product::isActive)
                .map(ProductSummaryResponse::from)
                .toList();
    }

    @Transactional
    public void add(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return;
        }
        Product product = productRepository.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        WishlistItem item = new WishlistItem();
        item.setUser(userService.getActiveUser(userId));
        item.setProduct(product);
        wishlistRepository.save(item);
    }

    @Transactional
    public void remove(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }
}

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> list(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.list(principal.getId())));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> add(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long productId
    ) {
        wishlistService.add(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok("Saved to wishlist", wishlistService.list(principal.getId())));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> remove(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long productId
    ) {
        wishlistService.remove(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok("Removed from wishlist", wishlistService.list(principal.getId())));
    }
}
