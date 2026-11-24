export function formatCurrency(value) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  const data = err.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors)[0];
    if (first) return String(first);
  }
  if (data?.message) return data.message;
  if (err.message) return err.message;
  return fallback;
}

export const ORDER_STATUS_META = {
  PENDING_PAYMENT: { label: 'Pending Payment', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PLACED: { label: 'Placed', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  PACKED: { label: 'Packed', cls: 'bg-violet-50 text-violet-800 border-violet-200' },
  SHIPPED: { label: 'Shipped', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
  DELIVERED: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
  RETURN_REQUESTED: { label: 'Return Requested', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  RETURNED: { label: 'Returned', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  REFUNDED: { label: 'Refunded', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
};

export const PAYMENT_STATUS_META = {
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
  REFUND_PENDING: { label: 'Refund Pending', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
  REFUNDED: { label: 'Refunded', cls: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
};
