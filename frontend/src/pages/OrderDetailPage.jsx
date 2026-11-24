import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDateTime } from '../utils/format';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatusBadge';
import { PageSpinner } from '../components/Skeletons';

const CANCELLABLE = new Set(['PENDING_PAYMENT', 'PLACED', 'CONFIRMED', 'PACKED']);

export function OrderDetailPage() {
  const { orderNumber } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reason, setReason] = useState('');
  const [actionMode, setActionMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getOrder(orderNumber);
      setOrder(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Order not found'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const updated =
        actionMode === 'cancel'
          ? await orderService.cancelOrder(order.orderNumber, reason.trim())
          : await orderService.requestReturn(order.orderNumber, reason.trim());
      setOrder(updated);
      setActionMode(null);
      setReason('');
      toast.success(actionMode === 'cancel' ? 'Order cancelled' : 'Return request submitted');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p className="text-base font-medium text-red-600">{error || 'Order not found'}</p>
        <Link to="/account?tab=orders" className="mt-4 inline-block text-sm text-navy underline">
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/account?tab=orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-600 hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to orders
        </Link>

        <div className="rounded-sm border border-zinc-200 bg-warmwhite p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <h1 className="text-xl font-semibold text-navy font-mono">{order.orderNumber}</h1>
              <p className="tabular-nums text-xs text-zinc-500 mt-1">
                Placed on {formatDateTime(order.createdAt)} &middot; {order.paymentMethod}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 text-sm">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Delivery Address
              </h3>
              <p className="font-medium text-zinc-900">{order.shippingRecipient}</p>
              <p className="text-zinc-600">
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ''}
              </p>
              <p className="text-zinc-600">
                {order.shippingCity}, {order.shippingState} - {order.shippingPostalCode}
              </p>
              <p className="text-zinc-500 text-xs mt-1">Phone: {order.shippingPhone}</p>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Payment Summary
              </h3>
              <dl className="tabular-nums space-y-1.5 text-zinc-600">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(order.subtotal)}</dd>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                    <dd>-{formatCurrency(order.discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{Number(order.shippingFee) === 0 ? 'Free' : formatCurrency(order.shippingFee)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-navy pt-2 border-t border-zinc-200">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.totalAmount)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {(CANCELLABLE.has(order.status) || order.status === 'DELIVERED') && (
            <div className="mt-5 border-t border-zinc-200 pt-4">
              {!actionMode ? (
                <div className="flex flex-wrap gap-3">
                  {CANCELLABLE.has(order.status) && (
                    <button
                      type="button"
                      onClick={() => setActionMode('cancel')}
                      className="rounded-sm border border-red-200 bg-white px-3.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button
                      type="button"
                      onClick={() => setActionMode('return')}
                      className="rounded-sm border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-surface"
                    >
                      Request Return
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleActionSubmit} className="space-y-3 max-w-md">
                  <label className="block text-xs font-medium text-zinc-700">
                    {actionMode === 'cancel' ? 'Reason for cancellation' : 'Reason for return'}
                  </label>
                  <input
                    required
                    minLength={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide brief details..."
                    className="w-full rounded-sm border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-sm bg-navy px-3.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionMode(null);
                        setReason('');
                      }}
                      className="rounded-sm border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="border-t border-b border-zinc-200 divide-y divide-zinc-200">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-16 w-16 shrink-0 rounded-sm border border-zinc-200 bg-surface overflow-hidden">
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{item.productName}</p>
                  <p className="tabular-nums text-xs text-zinc-500 mt-0.5">
                    {formatCurrency(item.unitPrice)} &times; {item.quantity}
                  </p>
                </div>
              </div>
              <span className="tabular-nums text-sm font-semibold text-zinc-900 shrink-0">
                {formatCurrency(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Status Timeline */}
        <div>
          <h2 className="text-sm font-semibold text-navy mb-4">Order Timeline</h2>
          <ol className="space-y-4 border-l border-zinc-200 ml-2 pl-5">
            {order.statusHistory.map((h, idx) => {
              const isLatest = idx === order.statusHistory.length - 1;
              return (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[29px] top-0.5 bg-white">
                    {isLatest ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-zinc-400" />
                    )}
                  </span>
                  <div className="text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-zinc-900">{h.toStatus}</span>
                      <span className="tabular-nums text-xs text-zinc-400">{formatDateTime(h.createdAt)}</span>
                    </div>
                    {h.note && <p className="text-xs text-zinc-600 mt-0.5">{h.note}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
