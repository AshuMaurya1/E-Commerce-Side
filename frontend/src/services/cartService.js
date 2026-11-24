import { api } from './api';

export const cartService = {
  async getCart() {
    const res = await api.get('/cart');
    return res.data.data;
  },
  async addItem(productId, quantity = 1) {
    const res = await api.post('/cart/items', { productId, quantity });
    return res.data.data;
  },
  async updateQuantity(productId, quantity) {
    const res = await api.put(`/cart/items/${productId}`, { quantity });
    return res.data.data;
  },
  async removeItem(productId) {
    const res = await api.delete(`/cart/items/${productId}`);
    return res.data.data;
  },
  async clearCart() {
    await api.delete('/cart');
  },
  async applyCoupon(code) {
    const res = await api.post('/cart/coupon', { code });
    return res.data.data;
  },
  async removeCoupon() {
    const res = await api.delete('/cart/coupon');
    return res.data.data;
  },
};

export const wishlistService = {
  async getWishlist() {
    const res = await api.get('/wishlist');
    return res.data.data;
  },
  async add(productId) {
    const res = await api.post(`/wishlist/${productId}`);
    return res.data.data;
  },
  async remove(productId) {
    const res = await api.delete(`/wishlist/${productId}`);
    return res.data.data;
  },
};
