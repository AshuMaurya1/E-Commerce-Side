import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency, formatDate } from '../../utils/format';

export function AdminCouponsPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderValue: '500',
    maxDiscount: '500',
    usageLimit: '',
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      setCoupons(await adminService.getCoupons());
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCoupon({
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue || 0),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: new Date(`${form.expiresAt}T23:59:59Z`).toISOString(),
        active: form.active,
      });
      toast.success('Coupon created');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleToggle = async (c) => {
    try {
      await adminService.toggleCouponStatus(c.id, !c.active);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (c) => {
    try {
      await adminService.deleteCoupon(c.id);
      toast.info('Coupon deleted');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Coupons</h1>
          <p className="text-sm text-zinc-500">Create percentage or fixed promo codes with usage and minimum thresholds.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-500">Loading...</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-navy">{c.code}</p>
                      {c.description && <p className="text-xs text-zinc-500">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-800">
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}%${c.maxDiscount ? ` (max ${formatCurrency(c.maxDiscount)})` : ''}`
                        : formatCurrency(c.discountValue)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatCurrency(c.minOrderValue)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {c.usedCount} / {c.usageLimit ?? '∞'}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        className={`rounded border px-2 py-0.5 text-xs font-medium ${
                          c.active
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${c.code}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-base font-semibold text-navy">New Coupon</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                placeholder="Code (e.g. FESTIVE15)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (₹)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Value"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Min order ₹"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Max discount ₹"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Usage limit"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  required
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-zinc-300 px-3.5 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-navy px-4 py-1.5 text-sm font-medium text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
