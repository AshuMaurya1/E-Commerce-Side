import React from 'react';

export function PageSpinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-navy" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="border border-zinc-200 bg-white rounded-md overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-zinc-200" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-20 bg-zinc-200 rounded" />
        <div className="h-4 w-3/4 bg-zinc-200 rounded" />
        <div className="h-4 w-1/2 bg-zinc-200 rounded" />
        <div className="pt-2 flex items-center justify-between">
          <div className="h-5 w-20 bg-zinc-200 rounded" />
          <div className="h-8 w-24 bg-zinc-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="border border-zinc-200 bg-white rounded-md overflow-hidden animate-pulse">
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-zinc-200 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
