import React from 'react';

export function PageSpinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-navy" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-sm bg-zinc-200" />
      <div className="pt-3 space-y-2">
        <div className="h-3 w-16 bg-zinc-200 rounded-sm" />
        <div className="h-4 w-4/5 bg-zinc-200 rounded-sm" />
        <div className="h-4 w-20 bg-zinc-200 rounded-sm" />
        <div className="h-8 w-full bg-zinc-200 rounded-sm mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="rounded-sm border border-zinc-200 bg-white overflow-hidden animate-pulse">
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-zinc-200 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
