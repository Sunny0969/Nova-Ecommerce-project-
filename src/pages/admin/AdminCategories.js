import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage, unwrapCategoriesResponse } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

function sortCategories(list) {
  return [...(list || [])].sort((a, b) => {
    const oa = Number(a.displayOrder) || 0;
    const ob = Number(b.displayOrder) || 0;
    if (oa !== ob) return oa - ob;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export default function AdminCategories() {
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);

  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createActive, setCreateActive] = useState(true);
  const [createFile, setCreateFile] = useState(null);

  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editOrder, setEditOrder] = useState(0);
  const [editFile, setEditFile] = useState(null);

  const sorted = useMemo(() => sortCategories(raw), [raw]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.categories.listAll();
      setRaw(unwrapCategoriesResponse(res));
    } catch (e) {
      const status = e?.response?.status;
      // Older API processes (node without restart) do not have GET /api/admin/categories yet
      if (status === 404) {
        try {
          const res = await adminAPI.categories.list();
          setRaw(unwrapCategoriesResponse(res));
          toast(
            'Loaded active categories only. Restart the backend so GET /api/admin/categories is registered (full list + inactive).',
            { icon: 'ℹ️', duration: 6000 }
          );
          return;
        } catch (e2) {
          toast.error(apiMessage(e2, 'Could not load categories'));
          setRaw([]);
          return;
        }
      }
      toast.error(apiMessage(e, 'Could not load categories'));
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (row) => {
    setEditRow(row);
    setEditName(row.name || '');
    setEditSlug(row.slug || '');
    setEditDesc(row.description || '');
    setEditActive(row.isActive !== false);
    setEditOrder(Number(row.displayOrder) || 0);
    setEditFile(null);
  };

  const handleCreate = async () => {
    if (busyId) return;
    const name = createName.trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    const fd = new FormData();
    fd.append('name', name);
    fd.append('slug', createSlug.trim());
    fd.append('description', createDesc.trim());
    fd.append('isActive', createActive ? 'true' : 'false');
    fd.append('displayOrder', String(sorted.length));
    if (createFile) fd.append('image', createFile, createFile.name);
    try {
      setBusyId('create');
      await adminAPI.categories.create(fd);
      toast.success('Category created');
      setCreateOpen(false);
      setCreateName('');
      setCreateSlug('');
      setCreateDesc('');
      setCreateActive(true);
      setCreateFile(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not create category'));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (busyId || !editRow?._id) return;
    const name = editName.trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    try {
      setBusyId(String(editRow._id));
      if (editFile) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('slug', editSlug.trim());
        fd.append('description', editDesc.trim());
        fd.append('isActive', editActive ? 'true' : 'false');
        fd.append('displayOrder', String(editOrder));
        fd.append('image', editFile, editFile.name);
        await adminAPI.categories.update(editRow._id, fd, { asFormData: true });
      } else {
        await adminAPI.categories.update(editRow._id, {
          name,
          slug: editSlug.trim() || undefined,
          description: editDesc.trim(),
          isActive: editActive,
          displayOrder: editOrder
        });
      }
      toast.success('Category updated');
      setEditRow(null);
      setEditFile(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update category'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (row) => {
    try {
      setBusyId(String(row._id));
      await adminAPI.categories.update(row._id, {
        isActive: !row.isActive
      });
      toast.success(row.isActive ? 'Category hidden from shop' : 'Category activated');
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (busyId || !deleteRow?._id) return;
    try {
      setBusyId(String(deleteRow._id));
      await adminAPI.categories.delete(deleteRow._id);
      toast.success('Category deleted');
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete'));
    } finally {
      setBusyId(null);
    }
  };

  const moveRow = async (index, direction) => {
    const j = index + direction;
    if (j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[j]] = [next[j], next[index]];
    const items = next.map((c, idx) => ({ id: String(c._id), displayOrder: idx }));
    try {
      setBusyId('reorder');
      await adminAPI.categories.reorder({ items });
      toast.success('Order updated');
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not reorder'));
    } finally {
      setBusyId(null);
    }
  };

  const formFieldClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

  return (
    <div className="admin-categories">
      <div className="admin-products__head">
        <div>
          <h1 className="admin-dashboard__title">Categories</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Manage shop categories, order, and visibility. Products only list active categories in the storefront.
          </p>
        </div>
        <button type="button" className="btn admin-products__add" onClick={() => setCreateOpen(true)}>
          <Plus size={18} aria-hidden /> Add category
        </button>
      </div>

      <p className="admin-categories__note">
        Public API returns <strong>active</strong> categories only. This view shows <strong>all</strong> categories.
      </p>

      {loading ? (
        <LoadingSpinner label="Loading categories" />
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap">
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Status</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No categories yet. Create one to organize products.
                  </td>
                </tr>
              ) : (
                sorted.map((row, index) => (
                  <tr key={row._id}>
                    <td>
                      <div className="admin-categories__order-btns">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-categories__icon-btn"
                          disabled={busyId === 'reorder' || index === 0}
                          onClick={() => moveRow(index, -1)}
                          title="Move up"
                        >
                          <ChevronUp size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-categories__icon-btn"
                          disabled={busyId === 'reorder' || index === sorted.length - 1}
                          onClick={() => moveRow(index, 1)}
                          title="Move down"
                        >
                          <ChevronDown size={16} aria-hidden />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="admin-table__link">{row.name}</span>
                    </td>
                    <td>
                      <code className="admin-categories__slug">{row.slug}</code>
                    </td>
                    <td>{Number(row.productCount) || 0}</td>
                    <td>
                      <span className={row.isActive !== false ? 'admin-categories__pill is-on' : 'admin-categories__pill is-off'}>
                        {row.isActive !== false ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-categories__actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busyId === String(row._id)}
                          onClick={() => handleToggleActive(row)}
                        >
                          {row.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>
                          <Pencil size={14} aria-hidden /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-categories__btn-danger"
                          onClick={() => setDeleteRow(row)}
                          disabled={(Number(row.productCount) || 0) > 0}
                          title={
                            (Number(row.productCount) || 0) > 0
                              ? 'Remove or reassign products first'
                              : 'Delete category'
                          }
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-categories__footer-hint">
        Assign categories when adding products in{' '}
        <Link to="/admin/products/new">Add product</Link>.
      </p>

      <Modal
        isOpen={createOpen}
        onClose={() => !busyId && setCreateOpen(false)}
        title="New category"
        confirmLabel={busyId === 'create' ? 'Creating…' : 'Create'}
        onConfirm={handleCreate}
        cancelLabel="Cancel"
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Name *
            <input className={formFieldClass} value={createName} onChange={(e) => setCreateName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Slug (optional)
            <input
              className={formFieldClass}
              value={createSlug}
              onChange={(e) => setCreateSlug(e.target.value)}
              placeholder="auto from name if empty"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Description
            <textarea className={formFieldClass} rows={3} value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input type="checkbox" checked={createActive} onChange={(e) => setCreateActive(e.target.checked)} />
            Active in storefront
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Image (optional)
            <input
              type="file"
              accept="image/*"
              className="text-sm text-neutral-600"
              onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!editRow}
        onClose={() => !busyId && setEditRow(null)}
        title="Edit category"
        confirmLabel={busyId && editRow && busyId === String(editRow._id) ? 'Saving…' : 'Save'}
        onConfirm={handleSaveEdit}
        cancelLabel="Cancel"
      >
        {editRow && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Name *
              <input className={formFieldClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Slug
              <input className={formFieldClass} value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Display order
              <input
                type="number"
                className={formFieldClass}
                value={editOrder}
                min={0}
                onChange={(e) => setEditOrder(Number(e.target.value) || 0)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Description
              <textarea className={formFieldClass} rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Active in storefront
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Replace image (optional)
              <input
                type="file"
                accept="image/*"
                className="text-sm text-neutral-600"
                onChange={(e) => setEditFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteRow}
        onClose={() => !busyId && setDeleteRow(null)}
        title="Delete category?"
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
      >
        {deleteRow && (
          <p>
            Delete <strong>{deleteRow.name}</strong> ({deleteRow.slug})? This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
