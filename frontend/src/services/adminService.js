import { api } from './api';

export const adminService = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },
  async getAnalytics(days = 30) {
    const res = await api.get('/admin/analytics', { params: { days } });
    return res.data.data;
  },
  async getProducts(params = {}) {
    const res = await api.get('/admin/products', { params });
    return res.data.data;
  },
  async getProduct(id) {
    const res = await api.get(`/admin/products/${id}`);
    return res.data.data;
  },
  async createProduct(payload) {
    const res = await api.post('/admin/products', payload);
    return res.data.data;
  },
  async updateProduct(id, payload) {
    const res = await api.put(`/admin/products/${id}`, payload);
    return res.data.data;
  },
  async toggleProductStatus(id, active) {
    const res = await api.patch(`/admin/products/${id}/status`, { active });
    return res.data.data;
  },
  async uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/admin/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  async getCategories() {
    const res = await api.get('/admin/categories');
    return res.data.data;
  },
  async createCategory(payload) {
    const res = await api.post('/admin/categories', payload);
    return res.data.data;
  },
  async updateCategory(id, payload) {
    const res = await api.put(`/admin/categories/${id}`, payload);
    return res.data.data;
  },
  async toggleCategoryStatus(id, active) {
    const res = await api.patch(`/admin/categories/${id}/status`, { active });
    return res.data.data;
  },
  async deleteCategory(id) {
    await api.delete(`/admin/categories/${id}`);
  },
  async getLowStock() {
    const res = await api.get('/admin/inventory/low-stock');
    return res.data.data;
  },
  async adjustInventory(payload) {
    const res = await api.post('/admin/inventory/adjust', payload);
    return res.data.data;
  },
  async getInventoryLogs(params = {}) {
    const res = await api.get('/admin/inventory/logs', { params });
    return res.data.data;
  },
  async getOrders(params = {}) {
    const res = await api.get('/admin/orders', { params });
    return res.data.data;
  },
  async getOrder(orderNumber) {
    const res = await api.get(`/admin/orders/${orderNumber}`);
    return res.data.data;
  },
  async updateOrderStatus(orderNumber, status, note) {
    const res = await api.patch(`/admin/orders/${orderNumber}/status`, { status, note });
    return res.data.data;
  },
  async getCustomers(params = {}) {
    const res = await api.get('/admin/customers', { params });
    return res.data.data;
  },
  async getCustomerOrders(customerId, page = 0) {
    const res = await api.get(`/admin/customers/${customerId}/orders`, { params: { page, size: 10 } });
    return res.data.data;
  },
  async toggleCustomerStatus(customerId, active) {
    const res = await api.patch(`/admin/customers/${customerId}/status`, { active });
    return res.data.data;
  },
  async getCoupons() {
    const res = await api.get('/admin/coupons');
    return res.data.data;
  },
  async createCoupon(payload) {
    const res = await api.post('/admin/coupons', payload);
    return res.data.data;
  },
  async updateCoupon(id, payload) {
    const res = await api.put(`/admin/coupons/${id}`, payload);
    return res.data.data;
  },
  async toggleCouponStatus(id, active) {
    const res = await api.patch(`/admin/coupons/${id}/status`, { active });
    return res.data.data;
  },
  async deleteCoupon(id) {
    await api.delete(`/admin/coupons/${id}`);
  },
  async getReviews(params = {}) {
    const res = await api.get('/admin/reviews', { params });
    return res.data.data;
  },
  async setReviewApproval(id, approved) {
    const res = await api.patch(`/admin/reviews/${id}/approval`, { approved });
    return res.data.data;
  },
  async deleteReview(id) {
    await api.delete(`/admin/reviews/${id}`);
  },
};
