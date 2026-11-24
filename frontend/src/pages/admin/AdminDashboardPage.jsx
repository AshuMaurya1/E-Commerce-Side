import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, IndianRupee, Package, ShoppingCart, Users } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { ErrorState } from '../../components/ErrorState';
import { formatCurrency, formatDate } from '../../utils/format';
import { SalesChart } from '../../components/SalesChart';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { PageSpinner } from '../../components/Skeletons';

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;
  if (error) return <ErrorState message={error} actionTo="/admin" />;
  if (!data) return null;

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), icon: IndianRupee },
    { label: 'Total Orders', value: data.totalOrders, icon: ShoppingCart },
    { label: 'Customers', value: data.totalCustomers, icon: Users },
    { label: 'Active Products', value: data.totalProducts, icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">Dashboard</h1>
          <p className="text-sm text-zinc-500">Live store metrics driven directly from database records.</p>
        </div>
        <div className="tabular-nums flex items-center gap-2.5 text-xs">
          <Link
            to="/admin/orders"
            className="rounded-sm border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-surface"
          >
            Pending Orders: <span className="font-semibold text-navy">{data.pendingOrders}</span>
          </Link>
          <Link
            to="/admin/inventory"
            className="inline-flex items-center gap-1.5 rounded-sm border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-800"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Low Stock: {data.lowStockCount}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-sm border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
              <Icon className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="tabular-nums mt-2 text-2xl font-semibold text-navy">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-sm border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-3">14-Day Revenue Trend</h2>
          <SalesChart data={data.dailySales} />
        </div>

        <div className="lg:col-span-5 rounded-sm border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">Top-Selling Products</h2>
            <Link to="/admin/products" className="text-xs font-medium text-emerald-700 hover:underline">
              Manage
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {data.topSellingProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No products yet.</p>
            ) : (
              data.topSellingProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-zinc-900 truncate">{p.name}</p>
                    <p className="tabular-nums text-xs text-zinc-500">
                      {p.soldCount} sold &middot; {p.stockQuantity} in stock
                    </p>
                  </div>
                  <span className="tabular-nums font-semibold text-zinc-900 shrink-0">
                    {formatCurrency(p.effectivePrice)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-sm border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-navy">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs font-medium text-emerald-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-warmwhite">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-zinc-700">{o.customerName}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                      <td className="tabular-nums px-4 py-3 text-xs text-zinc-500">{formatDate(o.createdAt)}</td>
                      <td className="tabular-nums px-4 py-3 text-right font-medium text-zinc-900">
                        {formatCurrency(o.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-sm border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">Low-Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-xs font-medium text-emerald-700 hover:underline">
              Restock
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {data.lowStockProducts.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">All active products are well stocked.</p>
            ) : (
              data.lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-zinc-900 truncate">{p.name}</p>
                    <p className="text-xs font-mono text-zinc-500">{p.sku}</p>
                  </div>
                  <span className="tabular-nums rounded-sm bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800 shrink-0">
                    {p.stockQuantity} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
