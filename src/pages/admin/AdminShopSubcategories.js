import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { apiMessage, unwrapCategoriesResponse } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const GENDER_LABELS = { women: 'Women', men: 'Men' };
const DEFAULT_CATEGORY = 'clothing';

const EMPTY_FORM = {
  gender: 'women',
  name: '',
  slug: '',
  displayOrder: 0,
  isActive: true,
  matchKeywords: ''
};

function parseKeywords(raw) {
  return String(raw || '')
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export default function AdminShopSubcategories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = (searchParams.get('category') || DEFAULT_CATEGORY).trim().toLowerCase();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [usesGender, setUsesGender] = useState(categorySlug === 'clothing');
  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminAPI.categories.listAll();
        if (!cancelled) setCategories(unwrapCategoriesResponse(res));
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    if (!usesGender) return { flat: rows };
    const map = { women: [], men: [] };
    for (const row of rows) {
      if (map[row.gender]) map[row.gender].push(row);
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0) || a.name.localeCompare(b.name)
      );
    }
    return map;
  }, [rows, usesGender]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.subcategories.list(categorySlug);
      const data = res?.data?.data || res?.data || {};
      setCategory(data.category || null);
      setUsesGender(Boolean(data.usesGender));
      setRows(Array.isArray(data.subcategories) ? data.subcategories : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load subcategories'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    load();
  }, [load]);

  const setCategorySlug = (slug) => {
    const next = new URLSearchParams(searchParams);
    next.set('category', slug);
    setSearchParams(next);
  };

  const openCreate = (gender = 'women') => {
    setEditRow(null);
    setForm({ ...EMPTY_FORM, gender: usesGender ? gender : '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditRow(row);
    setForm({
      gender: row.gender || 'women',
      name: row.name || '',
      slug: row.slug || '',
      displayOrder: Number(row.displayOrder) || 0,
      isActive: row.isActive !== false,
      matchKeywords: Array.isArray(row.matchKeywords) ? row.matchKeywords.join(', ') : ''
    });
    setModalOpen(true);
  };

  const save = async () => {
    const name = String(form.name || '').trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setBusy(true);
    try {
      const body = {
        categorySlug,
        gender: usesGender ? form.gender : '',
        name,
        slug: String(form.slug || '').trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive !== false,
        matchKeywords: parseKeywords(form.matchKeywords)
      };
      if (editRow?._id) {
        await adminAPI.subcategories.update(editRow._id, body);
        toast.success('Subcategory updated');
      } else {
        await adminAPI.subcategories.create(body);
        toast.success('Subcategory created');
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Save failed'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    setBusy(true);
    try {
      await adminAPI.subcategories.delete(row._id);
      toast.success('Deleted');
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Delete failed'));
    } finally {
      setBusy(false);
    }
  };

  const renderTable = (list) => (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            {!usesGender ? <th>Title keywords</th> : null}
            <th>Products</th>
            <th>Order</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row._id}>
              <td>{row.name}</td>
              <td>
                <code>{row.slug}</code>
              </td>
              {!usesGender ? (
                <td className="admin-table__muted">
                  {Array.isArray(row.matchKeywords) && row.matchKeywords.length
                    ? row.matchKeywords.join(', ')
                    : '—'}
                </td>
              ) : null}
              <td>{row.productCount ?? 0}</td>
              <td>{row.displayOrder ?? 0}</td>
              <td>{row.isActive === false ? 'Hidden' : 'Active'}</td>
              <td className="admin-table__actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(row)}>
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={busy || (row.productCount || 0) > 0}
                  title={(row.productCount || 0) > 0 ? 'Remove products first' : 'Delete'}
                  onClick={() => remove(row)}
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading && !rows.length) {
    return (
      <div className="admin-page">
        <LoadingSpinner label="Loading subcategories…" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Shop subcategories</h1>
          <p className="admin-page__subtitle">
            Sub-filters on category shop pages. Assign products in{' '}
            <Link to="/admin/products">Products</Link> when adding items.
          </p>
        </div>
        <Link to="/admin/categories" className="btn btn-outline btn-sm">
          ← Categories
        </Link>
      </div>

      <section className="admin-card" style={{ marginBottom: '1.25rem' }}>
        <label className="admin-label">
          Category
          <select
            className="admin-input"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
            {!categories.some((c) => c.slug === categorySlug) ? (
              <option value={categorySlug}>{category?.name || categorySlug}</option>
            ) : null}
          </select>
        </label>
        <p className="admin-muted" style={{ marginTop: '0.5rem' }}>
          {usesGender
            ? 'This category uses Women / Men groups (clothing).'
            : 'Flat subcategories — products match by assignment or product title keywords.'}
        </p>
      </section>

      {usesGender ? (
        ['women', 'men'].map((gender) => (
          <section key={gender} className="admin-card" style={{ marginBottom: '1.25rem' }}>
            <div
              className="admin-card__header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <h2 className="admin-card__title">{GENDER_LABELS[gender]}</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreate(gender)}>
                <Plus size={16} /> Add
              </button>
            </div>
            {grouped[gender]?.length === 0 ? (
              <p className="admin-muted">No subcategories yet.</p>
            ) : (
              renderTable(grouped[gender])
            )}
          </section>
        ))
      ) : (
        <section className="admin-card" style={{ marginBottom: '1.25rem' }}>
          <div
            className="admin-card__header"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h2 className="admin-card__title">{category?.name || 'Subcategories'}</h2>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreate()}>
              <Plus size={16} /> Add subcategory
            </button>
          </div>
          {rows.length === 0 ? (
            <p className="admin-muted">No subcategories yet — add Biscuits & Wafers, Chocolates, etc.</p>
          ) : (
            renderTable(rows)
          )}
        </section>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !busy && setModalOpen(false)}
        title={editRow ? 'Edit subcategory' : 'New subcategory'}
      >
        <div className="admin-form-stack">
          {usesGender ? (
            <label className="admin-label">
              Gender
              <select
                className="admin-input"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </label>
          ) : null}
          <label className="admin-label">
            Name
            <input
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Biscuits & Wafers"
            />
          </label>
          <label className="admin-label">
            Slug (optional)
            <input
              className="admin-input"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="biscuits-wafers"
            />
          </label>
          {!usesGender ? (
            <label className="admin-label">
              Title keywords (comma-separated)
              <textarea
                className="admin-input"
                rows={3}
                value={form.matchKeywords}
                onChange={(e) => setForm((f) => ({ ...f, matchKeywords: e.target.value }))}
                placeholder="biscuit, biscuits, wafer, wafers"
              />
              <span className="admin-muted">
                Products whose title contains any keyword appear in this subcategory filter.
              </span>
            </label>
          ) : null}
          <label className="admin-label">
            Display order
            <input
              type="number"
              className="admin-input"
              value={form.displayOrder}
              onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active on storefront
          </label>
          <div className="admin-form-actions">
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={save}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
