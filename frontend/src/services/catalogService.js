import { api } from './api';

export const catalogService = {
  async getCategories() {
    const res = await api.get('/categories');
    return res.data.data;
  },

  async getProducts(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const res = await api.get('/products', { params: cleanParams });
    return res.data.data;
  },

  async getProductDetail(slugOrId) {
    const res = await api.get(`/products/${slugOrId}`);
    return res.data.data;
  },

  async getRelatedProducts(productId) {
    const res = await api.get(`/products/${productId}/related`);
    return res.data.data;
  },

  async getProductReviews(productId, page = 0, size = 10) {
    const res = await api.get(`/reviews/product/${productId}`, { params: { page, size } });
    return res.data.data;
  },

  async createReview(payload) {
    const res = await api.post('/reviews', payload);
    return res.data.data;
  },

  async deleteReview(reviewId) {
    await api.delete(`/reviews/${reviewId}`);
  },

  async subscribeNewsletter(email) {
    const res = await api.post('/newsletter/subscribe', { email });
    return res.data;
  },
};
