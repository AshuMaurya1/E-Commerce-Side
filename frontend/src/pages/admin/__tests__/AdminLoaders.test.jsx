import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminAnalyticsPage } from '../AdminAnalyticsPage';
import { AdminDashboardPage } from '../AdminDashboardPage';
import { adminService } from '../../../services/adminService';

vi.mock('../../../services/adminService', () => ({
  adminService: {
    getDashboard: vi.fn(),
    getAnalytics: vi.fn(),
  },
}));

describe('admin data loading', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the dashboard error and retries the request', async () => {
    adminService.getDashboard
      .mockRejectedValueOnce({ response: { data: { message: 'Dashboard unavailable' } } })
      .mockResolvedValueOnce({
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        pendingOrders: 0,
        lowStockCount: 0,
        dailySales: [],
        topSellingProducts: [],
        recentOrders: [],
        lowStockProducts: [],
      });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Dashboard unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(adminService.getDashboard).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows the analytics error and retries the selected period', async () => {
    adminService.getAnalytics
      .mockRejectedValueOnce(new Error('Analytics unavailable'))
      .mockResolvedValueOnce({ salesTrend: [], ordersByStatus: {}, topProducts: [] });

    render(<AdminAnalyticsPage />);

    expect(await screen.findByText('Analytics unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(adminService.getAnalytics).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
  });
});
