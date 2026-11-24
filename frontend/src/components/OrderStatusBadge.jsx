import React from 'react';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../utils/format';

export function OrderStatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || {
    label: status,
    cls: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status] || {
    label: status,
    cls: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}
