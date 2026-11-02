import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { apiMessage } from '../../lib/api';
import { staffCategoriesAPI } from '../../api/staffCategoriesApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

function sortCategories(list) {
  return [...(list || [])].sort((a, b) => {
    const oa = Number(a.displayOrder) || 0;
    const ob = Number(b.displayOrder) || 0;
    if (oa !== ob) return oa - ob;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

export default function StaffCategories() {
  const { hasPermission } = useStaffAuth();

  const can = hasPermission('manageCategories');

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDisplayOrder, setCreateDisplayOrder] = useState(0);
  const [createIsActive, setCreateIsActive] = useState(true);

  const [editRow, setEditRow] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDisplayOrder, setEditDisplayOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);

  const [deleteRow, setDeleteRow] = useState(null);

  const sorted = useMemo(() => sortCategories(rows), [rows]);

  const load = useCallback(async () => {
    if (!can) return;
    setLoading(true);
    setError('');

    try {
      const res = await staffCategoriesAPI.list();
      const list = res?.data?.data || res?.data || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(String(apiMessage(e, 'Could not load categories')));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [can]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setCreateOpen(true);
    setCreateName('');
    setCreateDescription('');
    setCreateDisplayOrder(sorted.length);
    setCreateIsActive(true);
  };

  const handleCreate = async () => {
    if (busyId) return;
    const name = createName.trim();
    if (!name) return toast.error('Name is required');

    try {
      setBusyId('create');
      await staffCategoriesAPI.create({
        name,
        description: createDescription,
        displayOrder: createDisplayOrder,
        isActive: createIsActive
      });
      toast.success('Category created');
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not create category'));
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditName(row.name || '');
    setEditDescription(row.description || '');
    setEditDisplayOrder(Number(row.displayOrder) || 0);
    setEditIsActive(row.isActive !== false);
  };

  const handleSaveEdit = async () => {
    if (busyId || !editRow?._id) return;

    const name = editName.trim();
    if (!name) return toast.error('Name is required');

    try {
      setBusyId(String(editRow._id));
      await staffCategoriesAPI.update(editRow._id, {
        name,
        description: editDescription,
        displayOrder: editDisplayOrder,
        isActive: editIsActive
      });
      toast.success('Category updated');
      setEditRow(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update category'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (busyId || !deleteRow?._id) return;
    try {
      setBusyId(String(deleteRow._id));
      await staffCategoriesAPI.delete(deleteRow._id);
      toast.success('Category deleted');
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete category'));
    } finally {
      setBusyId(null);
    }
  };

  const formFieldClass =
    'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

  if (!can) {
    return (
      <div className="admin-categories" style={{ padding: '2rem' }}>
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 8,
            padding: '1rem 1.25rem',
            color: '#fca5a5'
          }}
        >
          You do not have permission to manage categories.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-categories" style={{ padding: '1.5rem 2rem' }}>
      <div className="admin-products__head" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="admin-dashboard__title" style={{ margin: 0, color: 'var(--cream, #fff)' }}>
            Categories
          </h1>
          <p className="admin-dashboard__lede" style={{ marginTop: 6, marginBottom: 0, color: '#9ca3af' }}>
            Manage your own categories and display order.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary admin-products__add"
          onClick={openCreate}
          style={{ background: 'var(--brand-orange, #ea580c)', color: '#fff' }}
        >
          <Plus size={18} aria-hidden /> Add category
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading categories" />
      ) : error ? (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 8,
            padding: '1rem 1.25rem',
            color: '#fca5a5',
            marginTop: 16
          }}
        >
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <div
          role="note"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            padding: '1.25rem',
            color: '#d1d5db',
            marginTop: 16,
            fontSize: '0.95rem'
          }}
        >
          No categories created yet. Click <strong>"Add category"</strong> to create your first category.
        </div>
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Name</th>
                <th>Status</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row._id}>
                  <td>{Number(row.displayOrder) || 0}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{row.name}</span>
                  </td>
                  <td>
                    <span className={row.isActive !== false ? 'admin-categories__pill is-on' : 'admin-categories__pill is-off'}>
                      {row.isActive !== false ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(row)}
                        disabled={busyId === String(row._id)}
                      >
                        <Pencil size={14} aria-hidden /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm admin-categories__btn-danger"
                        onClick={() => setDeleteRow(row)}
                        disabled={busyId === String(row._id)}
                      >
                        <Trash2 size={14} aria-hidden /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Category Modal */}
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
            <input
              className={formFieldClass}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Traditional Pottery"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Description
            <textarea
              className={formFieldClass}
              rows={3}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Short description..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Display order
            <input
              type="number"
              className={formFieldClass}
              value={createDisplayOrder}
              onChange={(e) => setCreateDisplayOrder(Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={createIsActive}
              onChange={(e) => setCreateIsActive(e.target.checked)}
            />
            <span>Active in storefront</span>
          </label>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editRow}
        onClose={() => !busyId && setEditRow(null)}
        title="Edit category"
        confirmLabel={busyId === String(editRow?._id) ? 'Saving…' : 'Save Changes'}
        onConfirm={handleSaveEdit}
        cancelLabel="Cancel"
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Name *
            <input
              className={formFieldClass}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Description
            <textarea
              className={formFieldClass}
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Display order
            <input
              type="number"
              className={formFieldClass}
              value={editDisplayOrder}
              onChange={(e) => setEditDisplayOrder(Number(e.target.value) || 0)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
            />
            <span>Active in storefront</span>
          </label>
        </div>
      </Modal>

      {/* Delete Category Modal */}
      <Modal
        isOpen={!!deleteRow}
        onClose={() => !busyId && setDeleteRow(null)}
        title="Delete category?"
        confirmLabel={busyId === String(deleteRow?._id) ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        cancelLabel="Cancel"
        danger
      >
        <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>
          Delete <strong>{deleteRow?.name}</strong>? (only allowed if no products use it)
        </p>
      </Modal>
    </div>
  );
}
