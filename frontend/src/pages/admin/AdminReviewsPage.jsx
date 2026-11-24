import React, { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatDate } from '../../utils/format';
import { Pagination } from '../../components/Pagination';

export function AdminReviewsPage() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], page: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const load = async (page = 0) => {
    setLoading(true);
    try {
      setData(await adminService.getReviews({ page, size: 15 }));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleApproval = async (r) => {
    try {
      await adminService.setReviewApproval(r.id, !r.approved);
      toast.success(r.approved ? 'Review hidden' : 'Review approved');
      load(data.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const remove = async (r) => {
    try {
      await adminService.deleteReview(r.id);
      toast.info('Review deleted');
      load(data.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Product Reviews</h1>
        <p className="text-sm text-zinc-500">Moderate customer ratings and reviews across the catalog.</p>
      </div>

      <div className="rounded-sm border border-zinc-200 bg-white overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {loading ? (
            <div className="p-6 text-center text-sm text-zinc-500">Loading...</div>
          ) : data.items.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">No customer reviews submitted yet.</div>
          ) : (
            data.items.map((r) => (
              <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-navy">{r.productName}</span>
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                    {r.verifiedPurchase && (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    By {r.reviewerName} &middot; {formatDate(r.createdAt)}
                  </p>
                  {r.title && <p className="text-sm font-medium text-zinc-900">{r.title}</p>}
                  <p className="text-sm text-zinc-700">{r.comment}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleApproval(r)}
                    className={`rounded border px-2.5 py-1 text-xs font-medium ${
                      r.approved
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {r.approved ? 'Approved' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r)}
                    className="rounded border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-4 pb-4">
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={load} />
        </div>
      </div>
    </div>
  );
}
