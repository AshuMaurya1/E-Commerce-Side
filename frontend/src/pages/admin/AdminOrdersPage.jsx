import React, { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDateTime } from '../../utils/format';
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/OrderStatusBadge';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';

const NEXT_TRANSITIONS = {
  PENDING_PAYMENT: ['PLACED', 'CANCELLED'],
  PLACED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['RETURN_REQUESTED'],
  RETURN_REQUESTED: ['RETURNED', 'DELIVERED'],
  RETURNED: ['REFUNDED'],
  CANCELLED: ['REFUNDED'],
  REFUNDED: [],
};

export function AdminOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState({ items: [], page: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadOrders = async (page = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getOrders({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        size: 15,
      });
      setOrders(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (orderNumber) => {
    try {
      const detail = await adminService.getOrder(orderNumber);
      setSelectedOrder(detail);
      const nextOpts = NEXT_TRANSITIONS[detail.status] || [];
      setTargetStatus(nextOpts[0] || '');
      setStatusNote('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!targetStatus || !selectedOrder) return;
    setUpdating(true);
    try {
      const updated = await adminService.updateOrderStatus(
        selectedOrder.orderNumber,
        targetStatus,
        statusNote.trim() || null
      );
      setSelectedOrder(updated);
      const nextOpts = NEXT_TRANSITIONS[updated.status] || [];
      setTargetStatus(nextOpts[0] || '');
      setStatusNote('');
      toast.success(`Order updated to ${updated.status}`);
      loadOrders(orders.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Orders</h1>
        <p className="text-sm text-zinc-500">Review orders, verify payments, and advance fulfillment states.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-zinc-200 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadOrders(0);
          }}
          className="flex gap-2 flex-1 min-w-[220px]"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer email, or recipient..."
            className="flex-1 rounded-sm border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm border border-zinc-300 bg-surface px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm border border-zinc-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.keys(NEXT_TRANSITIONS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <div className="rounded-sm border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.items.map((o) => (
                  <tr key={o.id} className="hover:bg-warmwhite">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-navy">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{o.customerName}</p>
                      <p className="text-xs text-zinc-500">{o.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PaymentStatusBadge status={o.paymentStatus} />
                        <span className="text-xs text-zinc-500">{o.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(o.orderNumber)}
                        className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-surface"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={orders.page} totalPages={orders.totalPages} onPageChange={loadOrders} />
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-sm border border-zinc-200 bg-white p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-navy font-mono">{selectedOrder.orderNumber}</h2>
                <p className="text-xs text-zinc-500">
                  {selectedOrder.customerName} ({selectedOrder.customerEmail}) &middot;{' '}
                  {formatDateTime(selectedOrder.createdAt)}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={selectedOrder.status} />
              <PaymentStatusBadge status={selectedOrder.paymentStatus} />
            </div>

            {(selectedOrder.cancellationReason || selectedOrder.returnReason) && (
              <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {selectedOrder.cancellationReason && (
                  <p><strong>Cancellation reason:</strong> {selectedOrder.cancellationReason}</p>
                )}
                {selectedOrder.returnReason && (
                  <p><strong>Return reason:</strong> {selectedOrder.returnReason}</p>
                )}
              </div>
            )}

            <div className="rounded border border-zinc-200 divide-y divide-zinc-100">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between px-4 py-2.5 text-sm">
                  <span>
                    {item.productName} <span className="text-zinc-500">&times; {item.quantity}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
              <div className="flex justify-between bg-surface px-4 py-2.5 text-sm font-semibold text-navy">
                <span>Total</span>
                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {(NEXT_TRANSITIONS[selectedOrder.status] || []).length > 0 && (
              <form onSubmit={handleStatusUpdate} className="border-t border-zinc-100 pt-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Advance Order Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  >
                    {(NEXT_TRANSITIONS[selectedOrder.status] || []).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Status note (optional)"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
