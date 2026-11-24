import React from 'react';
import { Link } from 'react-router-dom';

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="border border-zinc-200 bg-white rounded-md px-6 py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-zinc-500">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-zinc-600 max-w-md mx-auto">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
