import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, SlidersHorizontal, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import { apiMessage, fetchAdminCategories } from '../../lib/api';
import { downloadProductsCatalogPdf } from '../../lib/downloadProductsCatalogPdf';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { formatPKR } from '../../utils/currency';

const LIMIT = 25;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Unpublished' }
];

const ADJUST_FIELDS = [
  { value: 'price', label: 'Selling price' },
  { value: 'comparePrice', label: 'Actual / list price (compare at)' },
  { value: 'costPrice', label: 'Cost price' },
  { value: 'stock', label: 'Stock quantity' },
  { value: 'weightKg', label: 'Weight (kg)' }
];

export default function AdminProducts() {
  const { user } = useAuth();
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
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustField, setAdjustField] = useState('price');
  const [adjustMode, setAdjustMode] = useState('percent');
  const [adjustDirection, setAdjustDirection] = useState('increase');
  const [adjustValue, setAdjustValue] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfScope, setPdfScope] = useState('all');
  const [pdfCategoryIds, setPdfCategoryIds] = useState(() => new Set());
  const headerCheckRef = useRef(null);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setSelectAllMatching(false);
  }, [debouncedSearch, category, status]);

  const listFilterParams = useMemo(() => {
    const params = {};
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (category && category !== 'all') params.category = category;
    if (status !== 'all') params.status = status;
    return params;
  }, [debouncedSearch, category, status]);

  const loadCategories = useCallback(async () => {
    try {
      const list = await fetchAdminCategories(adminAPI);
      setCategories(list);
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
  const selectedCount = selectAllMatching ? totalCount : selected.size;
  const canSelectAllMatching = totalCount > pageIds.length && allOnPage && !selectAllMatching;

  useEffect(() => {
    if (headerCheckRef.current) {
      headerCheckRef.current.indeterminate = someOnPage && !allOnPage;
    }
  }, [someOnPage, allOnPage]);

  const toggleSelectAll = () => {
    setSelectAllMatching(false);
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
    setSelectAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      const s = String(id);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const resolveSelectedIds = async () => {
    if (!selectAllMatching) return [...selected];
    const res = await adminAPI.products.listIds(listFilterParams);
    const ids = res.data?.data?.ids;
    return Array.isArray(ids) ? ids.map(String) : [];
  };

  const runBulk = async (action) => {
    if (!selectAllMatching && selected.size === 0) {
      toast.error('Select at least one product');
      return;
    }
    setBulkBusy(true);
    try {
      const ids = await resolveSelectedIds();
      if (!ids.length) {
        toast.error('No products matched your filters');
        return;
      }
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
      setSelectAllMatching(false);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Bulk action failed'));
    } finally {
      setBulkBusy(false);
      setDeleteBulk(false);
    }
  };

  const handleSelectAllMatching = () => {
    setSelectAllMatching(true);
    setSelected(new Set(pageIds));
  };

  const runBulkAdjust = async () => {
    const value = Number(adjustValue);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a value greater than 0');
      return;
    }
    if (adjustMode === 'percent' && value > 1000) {
      toast.error('Percent cannot exceed 1000');
      return;
    }
    if (!selectAllMatching && selected.size === 0) {
      toast.error('Select at least one product');
      return;
    }

    setBulkBusy(true);
    try {
      const ids = await resolveSelectedIds();
      if (!ids.length) {
        toast.error('No products matched your filters');
        return;
      }

      const res = await adminAPI.products.bulk({
        action: 'adjust',
        ids,
        adjustment: {
          field: adjustField,
          mode: adjustMode,
          direction: adjustDirection,
          value
        }
      });
      const n = res.data?.data?.modified ?? 0;
      const fieldLabel = ADJUST_FIELDS.find((f) => f.value === adjustField)?.label || adjustField;
      toast.success(`Updated ${fieldLabel} on ${n} product(s)`);
      setAdjustOpen(false);
      setAdjustValue('');
      setSelected(new Set());
      setSelectAllMatching(false);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Bulk adjust failed'));
    } finally {
      setBulkBusy(false);
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

  const handleDownloadCatalogPdf = async () => {
    setPdfBusy(true);
    try {
      let params = {};
      let label = 'All products';

      let categoryOrder;
      if (pdfScope === 'selected') {
        const ids = await resolveSelectedIds();
        if (!ids.length) {
          toast.error('Select at least one product');
          return;
        }
        params = { ids: ids.join(',') };
        label = `${ids.length} selected product(s)`;
      } else if (pdfScope === 'category') {
        if (!pdfCategoryIds.size) {
          toast.error('Choose at least one category');
          return;
        }
        params = { categories: [...pdfCategoryIds].join(',') };
        const picked = categories.filter((c) => pdfCategoryIds.has(String(c._id)));
        categoryOrder = picked.map((c) => ({ id: String(c._id), name: c.name }));
        label =
          picked.length <= 2
            ? `Categories: ${picked.map((c) => c.name).join(', ')}`
            : `${picked.length} categories`;
      }

      const res = await adminAPI.products.exportCatalog(params);
      const rows = res.data?.data?.products;
      if (!Array.isArray(rows) || !rows.length) {
        toast.error('No products to export for this selection');
        return;
      }

      const pdfOpts = {
        subtitle: `${label} · ${rows.length} item(s) · ${new Date().toLocaleString('en-PK')}`
      };
      if (categoryOrder?.length) {
        pdfOpts.categoryOrder = categoryOrder;
      }

      await downloadProductsCatalogPdf(rows, pdfOpts);
      toast.success(`PDF downloaded (${rows.length} products)`);
      setPdfModalOpen(false);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not download product PDF'));
    } finally {
      setPdfBusy(false);
    }
  };

  const openPdfModal = () => {
    setPdfScope(selectedCount > 0 ? 'selected' : 'all');
    setPdfCategoryIds(new Set());
    setPdfModalOpen(true);
  };

  const togglePdfCategory = (categoryId) => {
    const id = String(categoryId);
    setPdfCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPdfCategories = () => {
    setPdfCategoryIds(new Set(categories.map((c) => String(c._id))));
  };

  const clearPdfCategories = () => {
    setPdfCategoryIds(new Set());
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
        <div className="admin-products__head-actions">
          {isAdmin ? (
            <button
              type="button"
              className="btn admin-products__pdf-btn"
              disabled={pdfBusy}
              onClick={openPdfModal}
            >
              <FileDown size={18} aria-hidden />
              Download PDF
            </button>
          ) : null}
          <Link to="/admin/products/new" className="btn admin-products__add">
            + Add product
          </Link>
        </div>
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
            <option key={c._id} value={c._id}>
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

      {isAdmin && selectedCount > 0 && (
        <div className="admin-products__bulk" role="region" aria-label="Bulk actions">
          <span className="admin-products__bulk-count">
            {selectedCount} selected
            {selectAllMatching ? ' (all matching filters)' : ''}
          </span>
          <button
            type="button"
            className="btn admin-products__bulk-btn admin-products__bulk-btn--accent"
            disabled={bulkBusy}
            onClick={() => setAdjustOpen(true)}
          >
            <SlidersHorizontal size={16} /> Adjust price / stock
          </button>
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

      {isAdmin && canSelectAllMatching && (
        <div className="admin-products__select-all-banner">
          All {pageIds.length} on this page are selected.{' '}
          <button
            type="button"
            className="admin-products__select-all-link"
            onClick={handleSelectAllMatching}
          >
            Select all {totalCount} products matching filters
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
                  {isAdmin ? (
                    <input
                      ref={headerCheckRef}
                      type="checkbox"
                      checked={allOnPage}
                      onChange={toggleSelectAll}
                      disabled={!pageIds.length}
                      aria-label="Select all on this page"
                    />
                  ) : null}
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
                      {isAdmin ? (
                        <input
                          type="checkbox"
                          checked={selected.has(String(p._id))}
                          onChange={() => toggleRow(p._id)}
                          aria-label={`Select ${p.name}`}
                        />
                      ) : null}
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
                    <td>{isAdmin ? (
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
                    ) : (
                      <span>{p.approvalStatus === 'pending_approval' ? 'Pending approval' : p.isPublished ? 'Published' : 'Unpublished'}</span>
                    )}</td>
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
                        {isAdmin ? (
                          <button
                            type="button"
                            className="btn admin-products__btn-del btn-sm"
                            onClick={() => setDeleteTarget(p)}
                          >
                            Delete
                          </button>
                        ) : null}
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

      {isAdmin ? (
        <>
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
            title={`Unpublish ${selectedCount} product(s)?`}
            danger
            confirmLabel={bulkBusy ? 'Working…' : 'Unpublish selected'}
            onConfirm={() => {
              if (!bulkBusy) runBulk('delete');
            }}
          >
            <p>Selected products will be removed from the shop (unpublished). This matches the
              single-product delete action.</p>
          </Modal>

          <Modal
            isOpen={adjustOpen}
            onClose={() => !bulkBusy && setAdjustOpen(false)}
            title={`Adjust ${selectedCount} product(s)`}
            confirmLabel={bulkBusy ? 'Applying…' : 'Apply to selected'}
            className="admin-products__adjust-modal"
            onConfirm={() => {
              if (!bulkBusy) runBulkAdjust();
            }}
          >
            <div className="admin-products__adjust-form">
              <p className="admin-products__adjust-lede">
                Change applies to every selected product
                {selectAllMatching ? ' matching your current filters' : ''}.
                Variant option prices are not changed — only the main product fields.
              </p>
              <label className="admin-products__adjust-label">
                Field
                <select
                  className="admin-products__adjust-input"
                  value={adjustField}
                  onChange={(e) => setAdjustField(e.target.value)}
                >
                  {ADJUST_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-products__adjust-row">
                <label className="admin-products__adjust-label">
                  Direction
                  <select
                    className="admin-products__adjust-input"
                    value={adjustDirection}
                    onChange={(e) => setAdjustDirection(e.target.value)}
                  >
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </label>
                <label className="admin-products__adjust-label">
                  By
                  <select
                    className="admin-products__adjust-input"
                    value={adjustMode}
                    onChange={(e) => setAdjustMode(e.target.value)}
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </label>
              </div>
              <label className="admin-products__adjust-label">
                {adjustMode === 'percent' ? 'Percent' : 'Amount'}
                <input
                  type="number"
                  min="0.01"
                  step={adjustMode === 'percent' ? '0.1' : '1'}
                  className="admin-products__adjust-input"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                  placeholder={adjustMode === 'percent' ? 'e.g. 20 for 20%' : 'e.g. 500'}
                />
              </label>
              {adjustMode === 'percent' && adjustValue && Number(adjustValue) > 0 && (
                <p className="admin-products__adjust-preview">
                  Example: {formatPKR(1000)} →{' '}
                  {formatPKR(
                    adjustDirection === 'decrease'
                      ? Math.max(0, 1000 - 1000 * (Number(adjustValue) / 100))
                      : 1000 + 1000 * (Number(adjustValue) / 100)
                  )}
                </p>
              )}
            </div>
          </Modal>

          <Modal
            isOpen={pdfModalOpen}
            onClose={() => !pdfBusy && setPdfModalOpen(false)}
            title="Download product PDF"
            confirmLabel={pdfBusy ? 'Preparing PDF…' : 'Download PDF'}
            className="admin-products__pdf-modal"
            onConfirm={() => {
              if (!pdfBusy) handleDownloadCatalogPdf();
            }}
          >
            <div className="admin-products__pdf-form">
              <p className="admin-products__pdf-lede">
                Choose products for the A4 PDF. Only name and qty are filled; Actual rate,
                Selling rate, Rate, and Weight columns are left blank for manual entry.
              </p>

              <fieldset className="admin-products__pdf-options">
                <legend className="admin-products__pdf-legend">Export scope</legend>

                <label className="admin-products__pdf-option">
                  <input
                    type="radio"
                    name="pdfScope"
                    value="all"
                    checked={pdfScope === 'all'}
                    onChange={() => setPdfScope('all')}
                  />
                  <span>
                    <strong>All products</strong>
                    <small>Full catalog ({totalCount} products)</small>
                  </span>
                </label>

                <label
                  className={`admin-products__pdf-option${selectedCount === 0 ? ' is-disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="pdfScope"
                    value="selected"
                    checked={pdfScope === 'selected'}
                    disabled={selectedCount === 0}
                    onChange={() => setPdfScope('selected')}
                  />
                  <span>
                    <strong>Selected only</strong>
                    <small>
                      {selectedCount > 0
                        ? `${selectedCount} product(s) checked${
                            selectAllMatching ? ' (all matching filters)' : ''
                          }`
                        : 'Select products from the table first'}
                    </small>
                  </span>
                </label>

                <label className="admin-products__pdf-option">
                  <input
                    type="radio"
                    name="pdfScope"
                    value="category"
                    checked={pdfScope === 'category'}
                    onChange={() => setPdfScope('category')}
                  />
                  <span>
                    <strong>By category</strong>
                    <small>Select one or more categories — products are combined in one PDF</small>
                  </span>
                </label>
              </fieldset>

              {pdfScope === 'category' ? (
                <div className="admin-products__pdf-categories">
                  <div className="admin-products__pdf-categories-head">
                    <span className="admin-products__pdf-categories-label">
                      Categories ({pdfCategoryIds.size} selected)
                    </span>
                    <div className="admin-products__pdf-categories-actions">
                      <button type="button" className="admin-products__pdf-link-btn" onClick={selectAllPdfCategories}>
                        Select all
                      </button>
                      <button type="button" className="admin-products__pdf-link-btn" onClick={clearPdfCategories}>
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="admin-products__pdf-category-list" role="group" aria-label="Categories">
                    {categories.length === 0 ? (
                      <p className="admin-products__pdf-categories-empty">No categories loaded</p>
                    ) : (
                      categories.map((c) => {
                        const id = String(c._id);
                        const checked = pdfCategoryIds.has(id);
                        return (
                          <label
                            key={c._id}
                            className={`admin-products__pdf-category-item${checked ? ' is-checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePdfCategory(id)}
                            />
                            <span>{c.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
