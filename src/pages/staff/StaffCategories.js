import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { apiMessage } from '../../lib/api';
import { staffCategoriesAPI } from '../../api/staffCategoriesApi';

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

  if (!can) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="api-error-banner" role="alert">
          You dont have permission to manage categories.
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Categories</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>
            Manage your own categories.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} aria-hidden /> Add category
        </button>
      </div>

      {loading ? (
        <p className="text-muted" style={{ marginTop: 16 }}>Loading</p>
      ) : error ? (
        <div className="api-error-banner" role="alert" style={{ marginTop: 16 }}>{error}</div>
      ) : sorted.length === 0 ? (
        <div className="api-error-banner" role="note" style={{ marginTop: 16 }}>
          No categories created yet.
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
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
                  <td>{row.name}</td>
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

      {createOpen ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>New category</h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Name*
                <input
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Description
                <textarea
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Display order
                <input
                  type="number"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  value={createDisplayOrder}
                  onChange={(e) => setCreateDisplayOrder(Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input type="checkbox" checked={createIsActive} onChange={(e) => setCreateIsActive(e.target.checked)} />
                Active in storefront
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)} disabled={busyId === 'create'}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={busyId === 'create'}>
                {busyId === 'create' ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editRow ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit category</h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Name*
                <input
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Description
                <textarea
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Display order
                <input
                  type="number"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(Number(e.target.value) || 0)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} />
                Active in storefront
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditRow(null)} disabled={busyId === String(editRow._id)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={busyId === String(editRow._id)}>
                {busyId === String(editRow._id) ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteRow ? (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Delete category?</h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Delete <strong>{deleteRow.name}</strong>? (only allowed if no products use it)
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setDeleteRow(null)} disabled={busyId === String(deleteRow._id)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busyId === String(deleteRow._id)}>
                {busyId === String(deleteRow._id) ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

