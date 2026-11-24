import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { extractErrorMessage } from '../../utils/format';

export function AdminCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', imageUrl: '', displayOrder: 0, active: true });

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await adminService.getCategories());
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

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', imageUrl: '', displayOrder: 0, active: true });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      displayOrder: cat.displayOrder || 0,
      active: cat.active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        displayOrder: Number(form.displayOrder || 0),
        active: form.active,
      };
      if (editing) {
        await adminService.updateCategory(editing.id, payload);
        toast.success('Category updated');
      } else {
        await adminService.createCategory(payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleToggle = async (cat) => {
    try {
      await adminService.toggleCategoryStatus(cat.id, !cat.active);
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (cat) => {
    try {
      await adminService.deleteCategory(cat.id);
      toast.info('Category deleted');
      load();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Categories</h1>
          <p className="text-sm text-zinc-500">Organize your product catalog hierarchy and display order.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-zinc-500">Loading...</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-warmwhite">
                  <td className="px-4 py-3 font-medium text-zinc-900">{cat.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-zinc-600">{cat.displayOrder}</td>
                  <td className="px-4 py-3 text-zinc-600">{cat.productCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(cat)}
                      className={`rounded border px-2 py-0.5 text-xs font-medium ${
                        cat.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-zinc-200 bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {cat.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="inline-flex items-center rounded border border-red-200 p-1 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${cat.name}`}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <h2 className="text-base font-semibold text-navy">
                {editing ? 'Edit Category' : 'New Category'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Category name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <textarea
                rows={2}
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder="Display order"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
