import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartService, wishlistService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { extractErrorMessage } from '../utils/format';

const CartContext = createContext(null);

const EMPTY_CART = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  appliedCouponCode: null,
  couponMessage: null,
  discountAmount: 0,
  shippingFee: 0,
  totalAmount: 0,
  freeShippingThreshold: 999,
  amountToFreeShipping: 999,
};

export function CartProvider({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const toast = useToast();
  const showError = toast.error;
  const [cart, setCart] = useState(EMPTY_CART);
  const [wishlist, setWishlist] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(EMPTY_CART);
      setWishlist([]);
      return;
    }
    setCartLoading(true);
    try {
      const [cartData, wishlistData] = await Promise.all([
        cartService.getCart(),
        wishlistService.getWishlist(),
      ]);
      setCart(cartData);
      setWishlist(wishlistData || []);
    } catch (err) {
      // Keep the last known cart, but surface the failure instead of silently
      // presenting stale data as though the refresh succeeded.
      showError(extractErrorMessage(err, 'Could not refresh your cart.'));
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated, showError]);

  useEffect(() => {
    if (authReady) {
      refreshCart();
    }
  }, [authReady, isAuthenticated, refreshCart]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        const updated = await cartService.addItem(productId, quantity);
        setCart(updated);
        toast.success('Added to your cart');
        return true;
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Could not add item to cart'));
        return false;
      }
    },
    [toast]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      try {
        const updated = await cartService.updateQuantity(productId, quantity);
        setCart(updated);
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Could not update quantity'));
      }
    },
    [toast]
  );

  const removeFromCart = useCallback(
    async (productId) => {
      try {
        const updated = await cartService.removeItem(productId);
        setCart(updated);
        toast.info('Removed item from cart');
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Could not remove item'));
      }
    },
    [toast]
  );

  const applyCoupon = useCallback(
    async (code) => {
      const updated = await cartService.applyCoupon(code);
      setCart(updated);
      return updated;
    },
    []
  );

  const removeCoupon = useCallback(async () => {
    const updated = await cartService.removeCoupon();
    setCart(updated);
    return updated;
  }, []);

  const toggleWishlist = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        toast.info('Please sign in to save items to your wishlist');
        return false;
      }
      const exists = wishlist.some((p) => p.id === productId);
      try {
        const updated = exists
          ? await wishlistService.remove(productId)
          : await wishlistService.add(productId);
        setWishlist(updated || []);
        toast.success(exists ? 'Removed from wishlist' : 'Saved to wishlist');
        return true;
      } catch (err) {
        toast.error(extractErrorMessage(err, 'Could not update wishlist'));
        return false;
      }
    },
    [isAuthenticated, wishlist, toast]
  );

  const clearLocalCart = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const wishlistIds = useMemo(() => new Set(wishlist.map((p) => p.id)), [wishlist]);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        wishlistIds,
        cartLoading,
        cartCount: cart.totalItems || 0,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        clearLocalCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
