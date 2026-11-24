import { api } from './api';

export const authService = {
  async login(payload) {
    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },

  async register(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data.data;
  },

  async refresh() {
    const res = await api.post('/auth/refresh');
    return res.data.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },
};
