import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Generic error UI component.
 * @param {Object} props
 * @param {string} props.message - Human-readable error message.
 * @param {string} [props.retryAction] - Optional label for a retry button.
 * @param {()=>void} [props.onRetry] - Callback invoked when retry is clicked.
 * @param {string} [props.actionTo] - Optional link destination for a secondary action.
 */
export function ErrorState({ message, retryAction, onRetry, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-zinc-200 bg-white px-6 py-12 text-center">
      <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-sm border border-red-200 bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{message}</h3>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        {onRetry && retryAction && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
          >
            {retryAction}
          </button>
        )}
        {actionTo && (
          <Link
            to={actionTo}
            className="inline-flex items-center rounded-sm border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-surface transition-colors"
          >
            Go back
          </Link>
        )}
      </div>
    </div>
  );
}
