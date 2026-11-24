import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { formatCurrency } from '../../utils/format';
import { SalesChart } from '../../components/SalesChart';
import { PageSpinner } from '../../components/Skeletons';

export function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminService
      .getAnalytics(days)
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <PageSpinner />;
  if (!data) return null;

  const totalPeriodRevenue = (data.salesTrend || []).reduce((acc, p) => acc + Number(p.revenue || 0), 0);
  const totalPeriodOrders = (data.salesTrend || []).reduce((acc, p) => acc + Number(p.orders || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Analytics</h1>
          <p className="text-sm text-zinc-500">Order volume, revenue trends, and product velocity.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Period Gross Order Value
          </p>
          <p className="mt-2 text-2xl font-semibold text-navy">{formatCurrency(totalPeriodRevenue)}</p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Period Orders (Non-Cancelled)
          </p>
          <p className="mt-2 text-2xl font-semibold text-navy">{totalPeriodOrders}</p>
        </div>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy mb-4">Revenue Over Time</h2>
        <SalesChart data={data.salesTrend} height={240} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Orders by Status</h2>
          {Object.keys(data.ordersByStatus || {}).length === 0 ? (
            <p className="text-sm text-zinc-500">No orders recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(data.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-zinc-700">{status}</span>
                  <span className="font-semibold text-navy">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Top Performing Products</h2>
          <div className="divide-y divide-zinc-100">
            {data.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-medium text-zinc-900 truncate pr-3">{p.name}</span>
                <span className="text-xs text-zinc-600 shrink-0">{p.soldCount} units sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
