package com.shopsphere.cart;

import com.shopsphere.cart.dto.CartDtos.AddCartItemRequest;
import com.shopsphere.cart.dto.CartDtos.CartItemResponse;
import com.shopsphere.cart.dto.CartDtos.CartResponse;
import com.shopsphere.common.exception.BadRequestException;
import com.shopsphere.common.exception.ResourceNotFoundException;
import com.shopsphere.config.AppProperties;
import com.shopsphere.coupon.CouponService;
import com.shopsphere.coupon.dto.CouponDtos.CouponValidationResult;
import com.shopsphere.product.Product;
import com.shopsphere.product.ProductRepository;
import com.shopsphere.user.User;
import com.shopsphere.user.UserService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserService userService;
    private final CouponService couponService;
    private final AppProperties appProperties;

    public CartService(
            CartRepository cartRepository,
            ProductRepository productRepository,
            UserService userService,
            CouponService couponService,
            AppProperties appProperties
    ) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userService = userService;
        this.couponService = couponService;
        this.appProperties = appProperties;
    }

    @Transactional
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponse addItem(Long userId, AddCartItemRequest request) {
        Product product = productRepository.findByIdAndActiveTrue(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or unavailable"));

        if (product.getStockQuantity() <= 0) {
            throw new BadRequestException(product.getName() + " is currently out of stock");
        }

        Cart cart = getOrCreateCart(userId);
        CartItem existing = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        int targetQty = request.quantity() + (existing != null ? existing.getQuantity() : 0);
        if (targetQty > product.getStockQuantity()) {
            throw new BadRequestException("Only " + product.getStockQuantity() + " units available for " + product.getName());
        }
        if (targetQty > 50) {
            throw new BadRequestException("Maximum 50 units allowed per item");
        }

        if (existing != null) {
            existing.setQuantity(targetQty);
        } else {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(targetQty);
            cart.getItems().add(item);
        }

        Cart saved = cartRepository.save(cart);
        return buildCartResponse(saved);
    }

    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long productId, int quantity) {
        Cart cart = getOrCreateCart(userId);
        CartItem existing = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Item not found in cart"));

        if (quantity <= 0) {
            cart.getItems().remove(existing);
        } else {
            Product product = productRepository.findByIdAndActiveTrue(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product is no longer available"));
            if (quantity > product.getStockQuantity()) {
                throw new BadRequestException("Only " + product.getStockQuantity() + " units available for " + product.getName());
            }
            existing.setQuantity(quantity);
        }

        Cart saved = cartRepository.save(cart);
        return buildCartResponse(saved);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = getOrCreateCart(userId);
        boolean removed = cart.getItems().removeIf(item -> item.getProduct().getId().equals(productId));
        if (!removed) {
            throw new ResourceNotFoundException("Item not found in cart");
        }
        if (cart.getItems().isEmpty()) {
            cart.setCouponCode(null);
        }
        Cart saved = cartRepository.save(cart);
        return buildCartResponse(saved);
    }

    @Transactional
    public CartResponse applyCoupon(Long userId, String code) {
        Cart cart = getOrCreateCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Add items to your cart before applying a coupon");
        }
        BigDecimal subtotal = calculateActiveSubtotal(cart);
        CouponValidationResult result = couponService.validateAndCalculate(code, subtotal);
        cart.setCouponCode(result.coupon().getCode());
        Cart saved = cartRepository.save(cart);
        return buildCartResponse(saved);
    }

    @Transactional
    public CartResponse removeCoupon(Long userId) {
        Cart cart = getOrCreateCart(userId);
        cart.setCouponCode(null);
        return buildCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cart.setCouponCode(null);
            cartRepository.save(cart);
        });
    }

    @Transactional
    public Cart getOrCreateCart(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userService.getActiveUser(userId);
            Cart cart = new Cart();
            cart.setUser(user);
            return cartRepository.save(cart);
        });
    }

    public BigDecimal calculateShippingFee(BigDecimal amountAfterDiscount) {
        if (amountAfterDiscount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal threshold = appProperties.getShipping().getFreeThreshold();
        if (amountAfterDiscount.compareTo(threshold) >= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return appProperties.getShipping().getFlatRate().setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateActiveSubtotal(Cart cart) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            Product p = item.getProduct();
            if (p.isActive()) {
                subtotal = subtotal.add(p.getEffectivePrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        return subtotal.setScale(2, RoundingMode.HALF_UP);
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItemResponse> itemResponses = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        int totalItems = 0;

        for (CartItem item : cart.getItems()) {
            Product p = item.getProduct();
            if (!p.isActive()) {
                continue;
            }
            BigDecimal unitPrice = p.getEffectivePrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()))
                    .setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(lineTotal);
            totalItems += item.getQuantity();

            itemResponses.add(new CartItemResponse(
                    p.getId(),
                    p.getName(),
                    p.getSlug(),
                    p.getSku(),
                    p.getPrimaryImageUrl(),
                    unitPrice,
                    p.getPrice().setScale(2, RoundingMode.HALF_UP),
                    item.getQuantity(),
                    p.getStockQuantity(),
                    p.getStockQuantity() >= item.getQuantity(),
                    lineTotal
            ));
        }

        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        String appliedCode = cart.getCouponCode();
        String couponMessage = null;

        if (appliedCode != null && !appliedCode.isBlank()) {
            if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
                cart.setCouponCode(null);
                appliedCode = null;
            } else {
                try {
                    CouponValidationResult validation = couponService.validateAndCalculate(appliedCode, subtotal);
                    discount = validation.discountAmount();
                    appliedCode = validation.coupon().getCode();
                } catch (BadRequestException ex) {
                    couponMessage = ex.getMessage();
                    cart.setCouponCode(null);
                    appliedCode = null;
                }
            }
        }

        BigDecimal afterDiscount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal shippingFee = calculateShippingFee(afterDiscount);
        BigDecimal total = afterDiscount.add(shippingFee).setScale(2, RoundingMode.HALF_UP);
        BigDecimal freeThreshold = appProperties.getShipping().getFreeThreshold().setScale(2, RoundingMode.HALF_UP);
        BigDecimal remaining = afterDiscount.compareTo(freeThreshold) >= 0 || afterDiscount.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : freeThreshold.subtract(afterDiscount).setScale(2, RoundingMode.HALF_UP);

        return new CartResponse(
                cart.getId(),
                itemResponses,
                totalItems,
                subtotal,
                appliedCode,
                couponMessage,
                discount,
                shippingFee,
                total,
                freeThreshold,
                remaining
        );
    }
}
