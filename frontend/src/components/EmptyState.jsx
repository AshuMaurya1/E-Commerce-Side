import React from 'react';
import { Link } from 'react-router-dom';

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="rounded-sm border border-zinc-200 bg-white px-6 py-14 text-center">
      {Icon && (
        <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-sm border border-zinc-200 bg-warmwhite text-zinc-500">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-zinc-600 max-w-md mx-auto">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center justify-center rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
