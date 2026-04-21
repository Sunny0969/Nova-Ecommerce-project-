import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';
import { apiMessage, unwrapCategoriesResponse, unwrapProductListResponse } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { formatPKR } from '../../utils/currency';

const formFieldClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

function unwrapCoupons(res) {
  const d = res.data?.data;
  return Array.isArray(d?.coupons) ? d.coupons : [];
}

function formatDiscount(row) {
  if (!row) return '—';
  if (row.discountType === 'percentage') return `${Number(row.discountValue) || 0}%`;
  return formatPKR(Number(row.discountValue || 0));
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
}

function formatApplies(row) {
  const t = row?.appliesTo?.type || 'all';
  if (t === 'all') return 'Entire cart';
  if (t === 'category') {
    const cats = row.appliesTo?.categories;
    if (!Array.isArray(cats) || !cats.length) return 'Categories (none)';
    return cats.map((c) => (typeof c === 'object' && c?.name ? c.name : String(c))).join(', ');
  }
  if (t === 'product') {
    const prods = row.appliesTo?.products;
    if (!Array.isArray(prods) || !prods.length) return 'Products (none)';
    return prods.map((p) => (typeof p === 'object' && p?.name ? p.name : String(p))).join(', ');
  }
  return t;
}

function usesLabel(row) {
  const u = Number(row?.usedCount) || 0;
  const m = row?.maxUses;
  if (m == null || m === '') return `${u} / ∞`;
  return `${u} / ${m}`;
}

function couponFormToPayload(form, { isCreate }) {
  const appliesTo = {
    type: form.appliesType,
    categories: form.appliesType === 'category' ? [...form.categoryIds] : [],
    products: form.appliesType === 'product' ? [...form.productIds] : []
  };
  const body = {
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minOrderAmount: Number(form.minOrderAmount) || 0,
    maxUses: form.maxUses === '' ? null : Number(form.maxUses),
    perCustomerLimit: form.perCustomerLimit === '' ? null : Number(form.perCustomerLimit),
    expiresAt: form.expiresAt || null,
    isActive: form.isActive,
    appliesTo
  };
  if (isCreate || form.code.trim()) {
    body.code = form.code.trim().toUpperCase();
  }
  return body;
}

function rowToForm(row) {
  const at = row?.appliesTo || {};
  const catIds = (at.categories || []).map((c) => (typeof c === 'object' && c?._id ? String(c._id) : String(c)));
  const prodIds = (at.products || []).map((p) => (typeof p === 'object' && p?._id ? String(p._id) : String(p)));
  return {
    code: row?.code || '',
    discountType: row?.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: row?.discountValue != null ? String(row.discountValue) : '',
    minOrderAmount: row?.minOrderAmount != null ? String(row.minOrderAmount) : '0',
    maxUses: row?.maxUses != null ? String(row.maxUses) : '',
    perCustomerLimit: row?.perCustomerLimit != null ? String(row.perCustomerLimit) : '',
    expiresAt: row?.expiresAt ? new Date(row.expiresAt).toISOString().slice(0, 10) : '',
    isActive: row?.isActive !== false,
    appliesType: ['all', 'category', 'product'].includes(at.type) ? at.type : 'all',
    categoryIds: catIds,
    productIds: prodIds
  };
}

const emptyForm = () => ({
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  maxUses: '',
  perCustomerLimit: '',
  expiresAt: '',
  isActive: true,
  appliesType: 'all',
  categoryIds: [],
  productIds: []
});

function firstFieldError(e) {
  const errs = e?.response?.data?.errors;
  if (errs && typeof errs === 'object') {
    const v = Object.values(errs)[0];
    if (v != null) return String(v);
  }
  return apiMessage(e, 'Request failed');
}

export default function AdminCoupons() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.coupons.list();
      setRows(unwrapCoupons(res));
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load coupons'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          adminAPI.categories.listAll().catch(() => adminAPI.categories.list()),
          adminAPI.products.listAdmin({ page: 1, limit: 100 })
        ]);
        if (cancelled) return;
        setCategories(unwrapCategoriesResponse(catRes));
        setProducts(unwrapProductListResponse(prodRes).products);
      } catch {
        if (!cancelled) {
          setCategories([]);
          setProducts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setCreateForm(emptyForm());
    setCreateOpen(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm(rowToForm(row));
  };

  const toggleCategory = (_form, setForm, id) => {
    const sid = String(id);
    setForm((f) => {
      const has = f.categoryIds.includes(sid);
      return {
        ...f,
        categoryIds: has ? f.categoryIds.filter((x) => x !== sid) : [...f.categoryIds, sid]
      };
    });
  };

  const toggleProduct = (_form, setForm, id) => {
    const sid = String(id);
    setForm((f) => {
      const has = f.productIds.includes(sid);
      return {
        ...f,
        productIds: has ? f.productIds.filter((x) => x !== sid) : [...f.productIds, sid]
      };
    });
  };

  const handleCreate = async () => {
    if (busyId) return;
    if (!createForm.code.trim()) {
      toast.error('Code is required');
      return;
    }
    if (createForm.discountValue === '' || Number.isNaN(Number(createForm.discountValue))) {
      toast.error('Discount value is required');
      return;
    }
    if (createForm.appliesType === 'category' && !createForm.categoryIds.length) {
      toast.error('Select at least one category');
      return;
    }
    if (createForm.appliesType === 'product' && !createForm.productIds.length) {
      toast.error('Select at least one product');
      return;
    }
    try {
      setBusyId('create');
      const body = couponFormToPayload(createForm, { isCreate: true });
      await adminAPI.coupons.create(body);
      toast.success('Coupon created');
      setCreateOpen(false);
      await load();
    } catch (e) {
      toast.error(firstFieldError(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (busyId || !editRow?._id) return;
    if (!editForm.code.trim()) {
      toast.error('Code is required');
      return;
    }
    if (editForm.discountValue === '' || Number.isNaN(Number(editForm.discountValue))) {
      toast.error('Discount value is required');
      return;
    }
    if (editForm.appliesType === 'category' && !editForm.categoryIds.length) {
      toast.error('Select at least one category');
      return;
    }
    if (editForm.appliesType === 'product' && !editForm.productIds.length) {
      toast.error('Select at least one product');
      return;
    }
    try {
      setBusyId(String(editRow._id));
      const body = couponFormToPayload(editForm, { isCreate: false });
      await adminAPI.coupons.update(editRow._id, body);
      toast.success('Coupon updated');
      setEditRow(null);
      await load();
    } catch (e) {
      toast.error(firstFieldError(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (row) => {
    try {
      setBusyId(`t-${row._id}`);
      await adminAPI.coupons.toggle(row._id);
      toast.success(row.isActive !== false ? 'Coupon deactivated' : 'Coupon activated');
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update coupon'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?._id || busyId) return;
    try {
      setBusyId(String(deleteRow._id));
      await adminAPI.coupons.delete(deleteRow._id);
      toast.success('Coupon deleted');
      setDeleteRow(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete'));
    } finally {
      setBusyId(null);
    }
  };

  const renderAppliesFields = (form, setForm) => (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
        Applies to
        <select
          className={formFieldClass}
          value={form.appliesType}
          onChange={(e) => setForm({ ...form, appliesType: e.target.value })}
        >
          <option value="all">Entire cart</option>
          <option value="category">Specific categories</option>
          <option value="product">Specific products</option>
        </select>
      </label>
      {form.appliesType === 'category' && (
        <div className="flex flex-col gap-1 text-sm text-neutral-800">
          <span className="font-medium">Categories</span>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
            {categories.length === 0 ? (
              <p className="text-neutral-500">No categories loaded.</p>
            ) : (
              <ul className="space-y-1">
                {categories.map((c) => {
                  const id = String(c._id);
                  const checked = form.categoryIds.includes(id);
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(form, setForm, id)}
                        />
                        {c.name || id}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      {form.appliesType === 'product' && (
        <div className="flex flex-col gap-1 text-sm text-neutral-800">
          <span className="font-medium">Products (up to 100 listed)</span>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-2">
            {products.length === 0 ? (
              <p className="text-neutral-500">No products loaded.</p>
            ) : (
              <ul className="space-y-1">
                {products.map((p) => {
                  const id = String(p._id);
                  const checked = form.productIds.includes(id);
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(form, setForm, id)}
                        />
                        {p.name || id}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="admin-coupons">
      <div className="admin-products__head">
        <div>
          <h1 className="admin-dashboard__title">Coupons</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Create discount codes, set usage limits and expiry, and scope to the whole cart, categories, or products.
          </p>
        </div>
        <button type="button" className="btn admin-products__add" onClick={openCreate}>
          <Plus size={18} aria-hidden /> Add coupon
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading coupons" />
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap">
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Uses</th>
                <th>Expires</th>
                <th>Scope</th>
                <th>Status</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    No coupons yet. Add one for checkout promotions.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={String(row._id)}>
                    <td>
                      <code className="admin-categories__slug">{row.code}</code>
                    </td>
                    <td>{formatDiscount(row)}</td>
                    <td>{formatPKR(Number(row.minOrderAmount || 0))}</td>
                    <td>{usesLabel(row)}</td>
                    <td>{formatDate(row.expiresAt)}</td>
                    <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>{formatApplies(row)}</td>
                    <td>
                      <span
                        className={row.isActive !== false ? 'admin-categories__pill is-on' : 'admin-categories__pill is-off'}
                      >
                        {row.isActive !== false ? 'Active' : 'Off'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-categories__actions">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>
                          <Pencil size={14} aria-hidden /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busyId === `t-${row._id}`}
                          onClick={() => handleToggle(row)}
                          title="Activate / deactivate"
                        >
                          <Power size={14} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-coupons__btn-danger"
                          disabled={busyId === String(row._id)}
                          onClick={() => setDeleteRow(row)}
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

      <Modal
        isOpen={createOpen}
        onClose={() => !busyId && setCreateOpen(false)}
        title="New coupon"
        confirmLabel={busyId === 'create' ? 'Creating…' : 'Create'}
        onConfirm={handleCreate}
        cancelLabel="Cancel"
      >
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Code *
            <input
              className={formFieldClass}
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
              placeholder="E.g. SAVE10"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Type *
              <select
                className={formFieldClass}
                value={createForm.discountType}
                onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value })}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed (PKR)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Value *
              <input
                className={formFieldClass}
                type="number"
                min={0}
                step={createForm.discountType === 'percentage' ? 1 : 0.01}
                max={createForm.discountType === 'percentage' ? 100 : undefined}
                value={createForm.discountValue}
                onChange={(e) => setCreateForm({ ...createForm, discountValue: e.target.value })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Minimum order (PKR)
            <input
              className={formFieldClass}
              type="number"
              min={0}
              step={0.01}
              value={createForm.minOrderAmount}
              onChange={(e) => setCreateForm({ ...createForm, minOrderAmount: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Max uses (empty = unlimited)
              <input
                className={formFieldClass}
                type="number"
                min={0}
                value={createForm.maxUses}
                onChange={(e) => setCreateForm({ ...createForm, maxUses: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Per-customer limit (empty = unlimited)
              <input
                className={formFieldClass}
                type="number"
                min={1}
                value={createForm.perCustomerLimit}
                onChange={(e) => setCreateForm({ ...createForm, perCustomerLimit: e.target.value })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
            Expires (optional)
            <input
              className={formFieldClass}
              type="date"
              value={createForm.expiresAt}
              onChange={(e) => setCreateForm({ ...createForm, expiresAt: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={createForm.isActive}
              onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
            />
            Active
          </label>
          {renderAppliesFields(createForm, setCreateForm)}
        </div>
      </Modal>

      <Modal
        isOpen={!!editRow}
        onClose={() => !busyId && setEditRow(null)}
        title="Edit coupon"
        confirmLabel={busyId && editRow && busyId === String(editRow._id) ? 'Saving…' : 'Save'}
        onConfirm={handleSaveEdit}
        cancelLabel="Cancel"
      >
        {editRow && (
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Code *
              <input
                className={formFieldClass}
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Type *
                <select
                  className={formFieldClass}
                  value={editForm.discountType}
                  onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed (PKR)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Value *
                <input
                  className={formFieldClass}
                  type="number"
                  min={0}
                  step={editForm.discountType === 'percentage' ? 1 : 0.01}
                  max={editForm.discountType === 'percentage' ? 100 : undefined}
                  value={editForm.discountValue}
                  onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Minimum order (PKR)
              <input
                className={formFieldClass}
                type="number"
                min={0}
                step={0.01}
                value={editForm.minOrderAmount}
                onChange={(e) => setEditForm({ ...editForm, minOrderAmount: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Max uses (empty = unlimited)
                <input
                  className={formFieldClass}
                  type="number"
                  min={0}
                  value={editForm.maxUses}
                  onChange={(e) => setEditForm({ ...editForm, maxUses: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                Per-customer limit (empty = unlimited)
                <input
                  className={formFieldClass}
                  type="number"
                  min={1}
                  value={editForm.perCustomerLimit}
                  onChange={(e) => setEditForm({ ...editForm, perCustomerLimit: e.target.value })}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Expires (optional)
              <input
                className={formFieldClass}
                type="date"
                value={editForm.expiresAt}
                onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              Active
            </label>
            {renderAppliesFields(editForm, setEditForm)}
            <p className="text-xs text-neutral-500">Uses: {usesLabel(editRow)} (read-only)</p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteRow}
        onClose={() => !busyId && setDeleteRow(null)}
        title="Delete coupon?"
        danger
        confirmLabel={busyId && deleteRow && busyId === String(deleteRow._id) ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
      >
        {deleteRow && (
          <p className="text-sm text-neutral-800">
            Remove code <strong>{deleteRow.code}</strong>? Carts that reference it will have the coupon cleared.
          </p>
        )}
      </Modal>
    </div>
  );
}
