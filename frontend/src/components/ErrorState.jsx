import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Generic error UI component.
 * @param {Object} props
 * @param {string} props.message - Human‑readable error message.
 * @param {string} [props.retryAction] - Optional label for a retry button.
 * @param {()=>void} [props.onRetry] - Callback invoked when retry is clicked.
 * @param {string} [props.actionTo] - Optional link destination for a secondary action.
 */
export function ErrorState({ message, retryAction, onRetry, actionTo }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-sm border border-zinc-200 bg-white p-8 text-center">
      <AlertTriangle className="h-12 w-12 text-emerald-700" />
      <h3 className="mt-4 text-lg font-semibold text-zinc-900">{message}</h3>
      {onRetry && retryAction && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          {retryAction}
        </button>
      )}
      {actionTo && (
        <Link
          to={actionTo}
          className="mt-3 inline-flex items-center rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 transition-colors"
        >
          Go back
        </Link>
      )}
    </div>
  );
}
