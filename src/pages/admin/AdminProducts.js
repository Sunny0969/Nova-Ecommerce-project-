import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';
import { apiMessage, unwrapCategoriesResponse } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { formatPKR } from '../../utils/currency';

const LIMIT = 25;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Unpublished' }
];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(() => new Set());
  const [savingId, setSavingId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBulk, setDeleteBulk] = useState(false);
  const headerCheckRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, status]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await adminAPI.categories.list();
      setCategories(unwrapCategoriesResponse(res));
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: LIMIT,
        status: status === 'all' ? undefined : status
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (category && category !== 'all') params.category = category;

      const res = await adminAPI.products.listAdmin(params);
      const d = res.data?.data;
      setProducts(Array.isArray(d?.products) ? d.products : []);
      setTotalCount(Number(d?.totalCount) || 0);
      setTotalPages(Number(d?.totalPages) || 0);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load products'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, status]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    load();
  }, [load]);

  const pageIds = useMemo(() => products.map((p) => String(p._id)), [products]);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someOnPage && !allOnPage;
    }
  }, [someOnPage, allOnPage]);

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const s = String(id);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const runBulk = async (action) => {
    const ids = [...selected];
    if (!ids.length) {
      toast.error('Select at least one product');
      return;
    }
    setBulkBusy(true);
    try {
      const res = await adminAPI.products.bulk({ action, ids });
      const n = res.data?.data?.modified ?? res.data?.data?.deleted ?? 0;
      if (action === 'delete' || action === 'deleteHard') {
        toast.success(
          action === 'deleteHard'
            ? `Permanently removed ${n} product(s)`
            : `Unpublished ${n} product(s)`
        );
      } else {
        toast.success(`Updated ${n} product(s)`);
      }
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
      setDeleteBulk(false);
    }
  };

  const handlePublishToggle = async (p, on) => {
    setSavingId(p._id);
    try {
      await adminAPI.products.update(String(p._id), { isPublished: on });
      setProducts((prev) =>
        prev.map((x) => (String(x._id) === String(p._id) ? { ...x, isPublished: on } : x))
      );
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update product'));
    } finally {
      setSavingId(null);
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setSavingId(deleteTarget._id);
    try {
      await adminAPI.products.delete(deleteTarget._id, false);
      toast.success('Product removed from the storefront');
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(String(deleteTarget._id));
        return next;
      });
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete product'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-products">
      <div className="admin-products__head">
        <div>
          <h1 className="admin-dashboard__title">Products</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Manage catalog, pricing, and availability.
          </p>
        </div>
        <Link to="/admin/products/new" className="btn admin-products__add">
          + Add product
        </Link>
      </div>

      <div className="admin-products__toolbar">
        <div className="admin-products__search-wrap">
          <Search className="admin-products__search-icon" size={18} aria-hidden />
          <input
            type="search"
            className="admin-products__search"
            placeholder="Search by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <select
          className="admin-products__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug || c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="admin-products__select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="admin-products__bulk" role="region" aria-label="Bulk actions">
          <span className="admin-products__bulk-count">
            {selected.size} selected
          </span>
          <button
            type="button"
            className="btn admin-products__bulk-btn"
            disabled={bulkBusy}
            onClick={() => runBulk('publish')}
          >
            <CheckCircle size={16} /> Publish
          </button>
          <button
            type="button"
            className="btn admin-products__bulk-btn"
            disabled={bulkBusy}
            onClick={() => runBulk('unpublish')}
          >
            <XCircle size={16} /> Unpublish
          </button>
          <button
            type="button"
            className="btn admin-products__bulk-btn admin-products__bulk-btn--danger"
            disabled={bulkBusy}
            onClick={() => setDeleteBulk(true)}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading products" />
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap">
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th className="admin-products__th-check">
                  <input
                    ref={headerCheckRef}
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleSelectAll}
                    disabled={!pageIds.length}
                    aria-label="Select all on this page"
                  />
                </th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Published</th>
                <th>Created</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-table__empty">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(String(p._id))}
                        onChange={() => toggleRow(p._id)}
                        aria-label={`Select ${p.name}`}
                      />
                    </td>
                    <td>
                      <div className="admin-product-cell__img admin-product-cell__img--sm">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            width={72}
                            height={72}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span aria-hidden>·</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-products__name">{p.name}</div>
                      <div className="admin-products__slug">{p.slug}</div>
                    </td>
                    <td>{p.category?.name || '—'}</td>
                    <td>{formatPKR(Number(p.price || 0))}</td>
                    <td>{p.stock}</td>
                    <td>
                      <label className="admin-toggle">
                        <input
                          type="checkbox"
                          className="admin-toggle__input"
                          checked={Boolean(p.isPublished)}
                          disabled={savingId === p._id}
                          onChange={(e) => handlePublishToggle(p, e.target.checked)}
                        />
                        <span className="admin-toggle__ui" />
                      </label>
                    </td>
                    <td>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td>
                      <div className="admin-products__row-actions">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="btn admin-products__btn-edit btn-sm"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="btn admin-products__btn-del btn-sm"
                          onClick={() => setDeleteTarget(p)}
                        >
                          Delete
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

      {totalPages > 1 && (
        <div className="admin-products__pagination" aria-label="Pagination">
          <span className="admin-products__page-info">
            Page {page} of {totalPages} · {totalCount} products
          </span>
          <div className="admin-products__page-btns">
            <button
              type="button"
              className="btn admin-products__page-nav"
              disabled={page <= 1}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            <button
              type="button"
              className="btn admin-products__page-nav"
              disabled={page >= totalPages}
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {totalPages <= 1 && totalCount > 0 && (
        <p className="admin-products__page-hint">
          {totalCount} product{totalCount === 1 ? '' : 's'}
        </p>
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => !savingId && setDeleteTarget(null)}
        title="Unpublish product?"
        danger
        confirmLabel={savingId ? 'Working…' : 'Unpublish from shop'}
        onConfirm={() => {
          if (!savingId) confirmSingleDelete();
        }}
      >
        <p>
          <strong>{deleteTarget?.name}</strong> will be removed from the storefront
          (soft delete). You can publish it again from this list or the edit page.
        </p>
      </Modal>

      <Modal
        isOpen={deleteBulk}
        onClose={() => !bulkBusy && setDeleteBulk(false)}
        title={`Unpublish ${selected.size} product(s)?`}
        danger
        confirmLabel={bulkBusy ? 'Working…' : 'Unpublish selected'}
        onConfirm={() => {
          if (!bulkBusy) runBulk('delete');
        }}
      >
        <p>Selected products will be removed from the shop (unpublished). This matches the
          single-product delete action.</p>
      </Modal>
    </div>
  );
}
