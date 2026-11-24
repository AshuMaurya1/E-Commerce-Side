import React from 'react';
import { formatCurrency } from '../utils/format';

export function SalesChart({ data = [], height = 210 }) {
  if (!data || data.length === 0) {
    return (
      <ErrorState message="No sales activity in this period yet." />
    );
  }
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
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pb-2 border-b border-dashed border-zinc-200 mb-3 tabular-nums">
        <span>Peak: {formatCurrency(maxRev)}</span>
        <span>{data.length} days</span>
      </div>
      <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
        {data.map((point, idx) => {
          const rev = Number(point.revenue || 0);
          const barPct = Math.max((rev / maxRev) * 100, rev > 0 ? 4 : 1);
          const dateLabel = point.date.slice(5);
          return (
            <div key={point.date} className="group relative flex-1 flex flex-col items-center h-full justify-end">
              <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-sm bg-navy px-2 py-1 text-[11px] text-white tabular-nums group-hover:block">
                {point.date}: {formatCurrency(rev)} ({point.orders} orders)
              </div>
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className={`w-full max-w-[24px] rounded-t-sm transition-colors ${
                    rev > 0 ? 'bg-navy group-hover:bg-emerald-700' : 'bg-zinc-200'
                  }`}
                  style={{ height: `${barPct}%` }}
                />
              </div>
              <span className="mt-1.5 text-[10px] text-zinc-500 h-4 tabular-nums">
                {idx % labelEvery === 0 ? dateLabel : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
