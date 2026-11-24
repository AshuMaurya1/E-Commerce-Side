import React from 'react';
import { formatCurrency } from '../utils/format';

export function SalesChart({ data = [], height = 210 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
        No sales activity in this period yet.
      </div>
    );
  }

  const maxRev = Math.max(...data.map((d) => Number(d.revenue || 0)), 1);
  const labelEvery = data.length > 16 ? 4 : 2;

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((point, idx) => {
          const rev = Number(point.revenue || 0);
          const barPct = Math.max((rev / maxRev) * 100, rev > 0 ? 4 : 1);
          const dateLabel = point.date.slice(5);
          return (
            <div key={point.date} className="group relative flex-1 flex flex-col items-center h-full justify-end">
              <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded bg-navy px-2 py-1 text-[11px] text-white group-hover:block">
                {point.date}: {formatCurrency(rev)} ({point.orders} orders)
              </div>
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className={`w-full max-w-[26px] rounded-t transition-colors ${
                    rev > 0 ? 'bg-navy group-hover:bg-emerald-600' : 'bg-zinc-200'
                  }`}
                  style={{ height: `${barPct}%` }}
                />
              </div>
              <span className="mt-1.5 text-[10px] text-zinc-500 h-4">
                {idx % labelEvery === 0 ? dateLabel : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
