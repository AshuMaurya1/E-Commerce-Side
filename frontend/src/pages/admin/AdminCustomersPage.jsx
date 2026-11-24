import React, { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/format';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { Pagination } from '../../components/Pagination';

export function AdminCustomersPage() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], page: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({ items: [], page: 0, totalPages: 0 });

  const loadCustomers = async (page = 0) => {
    setLoading(true);
    try {
      setData(await adminService.getCustomers({ search: search || undefined, page, size: 15 }));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStatus = async (c) => {
    try {
      await adminService.toggleCustomerStatus(c.id, !c.active);
      toast.success(c.active ? 'Customer deactivated' : 'Customer activated');
      loadCustomers(data.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const viewOrders = async (c) => {
    setSelectedCustomer(c);
    try {
      setCustomerOrders(await adminService.getCustomerOrders(c.id, 0));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Customers</h1>
        <p className="text-sm text-zinc-500">Search customer accounts, inspect order history, or manage access.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadCustomers(0);
        }}
        className="flex gap-2 rounded-sm border border-zinc-200 bg-white p-4 max-w-lg"
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or email..."
          className="flex-1 rounded-sm border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-sm border border-zinc-300 bg-surface px-3 py-1.5 text-sm font-medium"
        >
          Search
        </button>
      </form>

      <div className="rounded-sm border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">Loading...</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">No customers found.</td></tr>
              ) : (
                data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-warmwhite">
                    <td className="px-4 py-3 font-medium text-zinc-900">{c.fullName}</td>
                    <td className="px-4 py-3 text-zinc-600">{c.email}</td>
                    <td className="px-4 py-3 text-zinc-700">{c.totalOrders}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-600'
                        }`}
                      >
                        {c.active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => viewOrders(c)}
                        className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Orders
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={loadCustomers} />
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-sm border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-base font-semibold text-navy">{selectedCustomer.fullName}</h2>
                <p className="text-xs text-zinc-500">{selectedCustomer.email}</p>
              </div>
              <button type="button" onClick={() => setSelectedCustomer(null)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
            {customerOrders.items.length === 0 ? (
              <p className="text-sm text-zinc-500 py-4">No orders placed by this customer.</p>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                {customerOrders.items.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-mono text-xs font-semibold text-navy">{o.orderNumber}</p>
                      <p className="text-xs text-zinc-500">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <span className="font-medium">{formatCurrency(o.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
