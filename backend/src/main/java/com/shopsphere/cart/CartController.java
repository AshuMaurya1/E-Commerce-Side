package com.shopsphere.cart;

import com.shopsphere.auth.UserPrincipal;
import com.shopsphere.cart.dto.CartDtos.AddCartItemRequest;
import com.shopsphere.cart.dto.CartDtos.ApplyCouponRequest;
import com.shopsphere.cart.dto.CartDtos.CartResponse;
import com.shopsphere.cart.dto.CartDtos.UpdateCartItemRequest;
import com.shopsphere.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(principal.getId())));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Added to cart", cartService.addItem(principal.getId(), request)));
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long productId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Cart updated",
                cartService.updateItemQuantity(principal.getId(), productId, request.quantity())));
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Item removed", cartService.removeItem(principal.getId(), productId)));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clear(@AuthenticationPrincipal UserPrincipal principal) {
        cartService.clearCart(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Cart cleared", null));
    }

    @PostMapping("/coupon")
    public ResponseEntity<ApiResponse<CartResponse>> applyCoupon(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ApplyCouponRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Coupon applied",
                cartService.applyCoupon(principal.getId(), request.code())));
    }

    @DeleteMapping("/coupon")
    public ResponseEntity<ApiResponse<CartResponse>> removeCoupon(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Coupon removed", cartService.removeCoupon(principal.getId())));
    }
}
