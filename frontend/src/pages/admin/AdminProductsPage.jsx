import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Upload, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { catalogService } from '../../services/catalogService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage, formatCurrency } from '../../utils/format';
import { Pagination } from '../../components/Pagination';
import { TableSkeleton } from '../../components/Skeletons';
import { ErrorState } from '../../components/ErrorState';

const INITIAL_FORM = {
  categoryId: '',
  name: '',
  sku: '',
  brand: '',
  shortDescription: '',
  description: '',
  price: '',
  discountPrice: '',
  stockQuantity: '10',
  lowStockThreshold: '5',
  featured: false,
  trending: false,
  active: true,
  imageUrls: [''],
};

export function AdminProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState({ items: [], page: 0, totalPages: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadProducts = async (page = 0) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getProducts({
        search: search || undefined,
        categoryId: categoryId || undefined,
        lowStockOnly,
        page,
        size: 12,
      });
      setProducts(res);
    } catch (err) {
      const msg = extractErrorMessage(err, 'Could not load products.');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    catalogService.getCategories()
      .then(setCategories)
      .catch(() => {
        adminService.getCategories()
          .then(setCategories)
          .catch(() => setCategories([]));
      });
  }, []);

  useEffect(() => {
    loadProducts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, lowStockOnly]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...INITIAL_FORM,
      categoryId: categories[0]?.id ? String(categories[0].id) : '',
    });
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const p = await adminService.getProduct(id);
      setEditingId(p.id);
      setForm({
        categoryId: String(p.categoryId),
        name: p.name,
        sku: p.sku,
        brand: p.brand || '',
        shortDescription: p.shortDescription || '',
        description: p.description,
        price: String(p.price),
        discountPrice: p.discountPrice != null ? String(p.discountPrice) : '',
        stockQuantity: String(p.stockQuantity),
        lowStockThreshold: String(p.lowStockThreshold),
        featured: p.featured,
        trending: p.trending,
        active: p.active,
        imageUrls: p.images?.length ? p.images.map((i) => i.imageUrl) : [''],
      });
      setModalOpen(true);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminService.uploadImage(file);
      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls.filter((u) => u.trim() !== ''), res.url],
      }));
      toast.success(`Uploaded via ${res.storageProvider}`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Image upload failed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const images = form.imageUrls
        .map((u) => u.trim())
        .filter(Boolean)
        .map((url, idx) => ({
          imageUrl: url,
          altText: form.name.trim(),
          primaryImage: idx === 0,
          sortOrder: idx,
        }));

      const payload = {
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        sku: form.sku.trim(),
        brand: form.brand.trim() || null,
        shortDescription: form.shortDescription.trim() || null,
        description: form.description.trim(),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
        featured: form.featured,
        trending: form.trending,
        active: form.active,
        images,
      };

      if (editingId) {
        await adminService.updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await adminService.createProduct(payload);
        toast.success('Product created');
      }
      setModalOpen(false);
      loadProducts(products.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (p) => {
    try {
      await adminService.toggleProductStatus(p.id, !p.active);
      toast.success(p.active ? 'Product deactivated' : 'Product activated');
      loadProducts(products.page);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Products</h1>
          <p className="text-sm text-zinc-500">Manage catalog items, pricing, images, and availability.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-zinc-200 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadProducts(0);
          }}
          className="flex gap-2 flex-1 min-w-[220px]"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="flex-1 rounded-sm border border-zinc-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-sm border border-zinc-300 bg-surface px-3 py-1.5 text-sm font-medium text-zinc-800"
          >
            Search
          </button>
        </form>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-sm border border-zinc-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : error ? (
        <ErrorState message={error} retryAction="Retry" onRetry={() => loadProducts(products.page)} />
      ) : (
        <div className="rounded-sm border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {products.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  products.items.map((p) => (
                    <tr key={p.id} className="hover:bg-warmwhite">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-sm border border-zinc-200 bg-surface overflow-hidden">
                            {p.primaryImageUrl && (
                              <img src={p.primaryImageUrl} alt={p.name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <span className="font-medium text-zinc-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{p.sku}</td>
                      <td className="px-4 py-3 text-zinc-600">{p.categoryName}</td>
                      <td className="tabular-nums px-4 py-3">
                        <span className="font-medium text-zinc-900">{formatCurrency(p.effectivePrice)}</span>
                        {p.discountPrice != null && (
                          <span className="ml-1.5 text-xs text-zinc-400 line-through">
                            {formatCurrency(p.price)}
                          </span>
                        )}
                      </td>
                      <td className="tabular-nums px-4 py-3">
                        <span
                          className={`font-medium ${
                            p.stockQuantity <= p.lowStockThreshold ? 'text-amber-700' : 'text-zinc-900'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className={`rounded-sm border px-2 py-0.5 text-xs font-medium ${
                            p.active
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {p.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(p.id)}
                          className="inline-flex items-center gap-1 rounded-sm border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-surface"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination page={products.page} totalPages={products.totalPages} onPageChange={loadProducts} />
          </div>
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-sm border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-lg font-semibold text-navy">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-zinc-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Product Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">SKU *</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.discountPrice}
                    onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Low-Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Short Description</label>
                <input
                  maxLength={320}
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-zinc-700">Product Image URLs</label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-emerald-700 hover:underline">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <div className="space-y-2">
                  {form.imageUrls.map((url, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={url}
                        onChange={(e) => {
                          const next = [...form.imageUrls];
                          next[idx] = e.target.value;
                          setForm({ ...form, imageUrls: next });
                        }}
                        className="flex-1 rounded-sm border border-zinc-300 px-3 py-1.5 text-sm"
                      />
                      {form.imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              imageUrls: form.imageUrls.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-zinc-400 hover:text-red-600 px-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrls: [...form.imageUrls, ''] })}
                    className="text-xs font-medium text-navy hover:underline"
                  >
                    + Add another image URL
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-1 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.trending}
                    onChange={(e) => setForm({ ...form, trending: e.target.checked })}
                  />
                  Trending
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-sm border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-sm bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
