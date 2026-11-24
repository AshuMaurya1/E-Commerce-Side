import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 pt-5 mt-8">
      <p className="tabular-nums text-xs text-zinc-600">
        Page <span className="font-semibold text-zinc-900">{page + 1}</span> of{' '}
        <span className="font-semibold text-zinc-900">{totalPages}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="inline-flex items-center gap-1 rounded-sm border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          className="inline-flex items-center gap-1 rounded-sm border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
