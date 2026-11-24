import React, { useEffect, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatDateTime } from '../../utils/format';
import { Pagination } from '../../components/Pagination';

export function AdminInventoryPage() {
  const toast = useToast();
  const [lowStock, setLowStock] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [logs, setLogs] = useState({ items: [], page: 0, totalPages: 0 });
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantityDelta: '10', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async (logPage = 0) => {
    try {
      const [low, prods, logData] = await Promise.all([
        adminService.getLowStock(),
        adminService.getProducts({ size: 100 }),
        adminService.getInventoryLogs({ page: logPage, size: 15 }),
      ]);
      setLowStock(low || []);
      setAllProducts(prods.items || []);
      setLogs(logData);
      if (!adjustForm.productId && prods.items?.length) {
        setAdjustForm((f) => ({ ...f, productId: String(prods.items[0].id) }));
      }
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  useEffect(() => {
    loadAll(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.adjustInventory({
        productId: Number(adjustForm.productId),
        quantityDelta: Number(adjustForm.quantityDelta),
        note: adjustForm.note.trim() || 'Manual stock adjustment',
      });
      toast.success('Stock updated and logged');
      setAdjustForm((f) => ({ ...f, note: '' }));
      loadAll(0);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Inventory Management</h1>
        <p className="text-sm text-zinc-500">Monitor low-stock alerts, adjust stock safely, and inspect audit logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manual Adjustment */}
        <form onSubmit={handleAdjust} className="lg:col-span-5 rounded-md border border-zinc-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-navy flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adjust Product Stock
          </h2>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Product</label>
            <select
              required
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.stockQuantity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Quantity Delta (positive to restock, negative to deduct)
            </label>
            <input
              type="number"
              required
              value={adjustForm.quantityDelta}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Reason / Note</label>
            <input
              value={adjustForm.note}
              onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
              placeholder="Supplier restock PO-402"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-navy py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {submitting ? 'Applying...' : 'Apply Adjustment'}
          </button>
        </form>

        {/* Low Stock List */}
        <div className="lg:col-span-7 rounded-md border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Low-Stock Alerts ({lowStock.length})
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6">No products below low-stock threshold.</p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-72 overflow-y-auto">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs font-mono text-zinc-500">
                      {p.sku} &middot; Threshold: {p.lowStockThreshold}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {p.stockQuantity} units
                    </span>
                    <button
                      type="button"
                      onClick={() => setAdjustForm({ productId: String(p.id), quantityDelta: '15', note: 'Restock' })}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Quick Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs */}
      <div className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-navy">Inventory Audit Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Delta</th>
                <th className="px-4 py-2.5">Stock</th>
                <th className="px-4 py-2.5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.items.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 text-xs text-zinc-500 whitespace-nowrap">
                    {formatDateTime(l.createdAt)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-zinc-900">{l.productName}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">{l.actionType}</td>
                  <td className={`px-4 py-2.5 font-semibold ${l.quantityDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {l.quantityDelta >= 0 ? `+${l.quantityDelta}` : l.quantityDelta}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-700">
                    {l.previousStock} &rarr; {l.newStock}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-zinc-600">{l.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4">
          <Pagination
            page={logs.page}
            totalPages={logs.totalPages}
            onPageChange={(next) => loadAll(next)}
          />
        </div>
      </div>
    </div>
  );
}
