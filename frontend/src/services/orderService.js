import { api } from './api';

export const orderService = {
  async placeOrder(payload) {
    const res = await api.post('/orders', payload);
    return res.data.data;
  },
  async listOrders(page = 0, size = 10) {
    const res = await api.get('/orders', { params: { page, size } });
    return res.data.data;
  },
  async getOrder(orderNumber) {
    const res = await api.get(`/orders/${orderNumber}`);
    return res.data.data;
  },
  async cancelOrder(orderNumber, reason) {
    const res = await api.post(`/orders/${orderNumber}/cancel`, { reason });
    return res.data.data;
  },
  async requestReturn(orderNumber, reason) {
    const res = await api.post(`/orders/${orderNumber}/return`, { reason });
    return res.data.data;
  },
  async createRazorpayOrder(orderNumber) {
    const res = await api.post('/payments/razorpay/order', { orderNumber });
    return res.data.data;
  },
  async verifyRazorpayPayment(payload) {
    const res = await api.post('/payments/razorpay/verify', payload);
    return res.data.data;
  },
  async simulateTestPayment(orderNumber) {
    const res = await api.post('/payments/razorpay/simulate-success', { orderNumber });
    return res.data.data;
  },
  async reportPaymentFailure(orderNumber, razorpayOrderId, reason) {
    await api.post('/payments/razorpay/fail', { orderNumber, razorpayOrderId, reason });
  },
};

export const accountService = {
  async getProfile() {
    const res = await api.get('/users/me');
    return res.data.data;
  },
  async updateProfile(payload) {
    const res = await api.put('/users/me', payload);
    return res.data.data;
  },
  async changePassword(payload) {
    const res = await api.put('/users/me/password', payload);
    return res.data;
  },
  async getAddresses() {
    const res = await api.get('/addresses');
    return res.data.data;
  },
  async createAddress(payload) {
    const res = await api.post('/addresses', payload);
    return res.data.data;
  },
  async updateAddress(id, payload) {
    const res = await api.put(`/addresses/${id}`, payload);
    return res.data.data;
  },
  async setDefaultAddress(id) {
    const res = await api.patch(`/addresses/${id}/default`);
    return res.data.data;
  },
  async deleteAddress(id) {
    await api.delete(`/addresses/${id}`);
  },
};
