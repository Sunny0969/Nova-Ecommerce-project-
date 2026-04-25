import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Eye, Ban, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { formatPKR } from '../../utils/currency';

const LIMIT = 20;

function formatMoney(n) {
  return formatPKR(Number(n) || 0);
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

function orderIdShort(id) {
  if (!id) return '—';
  const s = String(id);
  if (s.length <= 8) return s;
  return `…${s.slice(-8)}`;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await adminAPI.customers.list(params);
      const d = res.data?.data;
      setCustomers(Array.isArray(d?.customers) ? d.customers : []);
      setTotalCount(Number(d?.totalCount) || 0);
      setTotalPages(Number(d?.totalPages) || 0);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load customers'));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await adminAPI.customers.getOne(detailId);
        const d = res.data?.data;
        if (!cancelled) {
          setDetail({
            customer: d?.customer || null,
            orders: Array.isArray(d?.orders) ? d.orders : [],
            totalSpent: Number(d?.totalSpent) || 0
          });
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(apiMessage(e, 'Could not load customer'));
          setDetailId(null);
          setDetail(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const handleBan = async (row) => {
    if (!row?._id || busyId) return;
    try {
      setBusyId(String(row._id));
      await adminAPI.customers.ban(row._id, {});
      toast.success(row.isActive !== false ? 'Customer banned' : 'Customer unbanned');
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update account'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow?._id || busyId) return;
    try {
      setBusyId(String(deleteRow._id));
      await adminAPI.customers.delete(deleteRow._id);
      toast.success('Customer removed');
      setDeleteRow(null);
      if (detailId === String(deleteRow._id)) setDetailId(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete customer'));
    } finally {
      setBusyId(null);
    }
  };

  const c = detail?.customer;

  return (
    <div className="admin-customers">
      <div className="admin-orders__head">
        <div>
          <h1 className="admin-dashboard__title">Customers</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Registered shoppers with the <strong>customer</strong> role. Search by name or email; open a row for
            orders and lifetime spend.
          </p>
        </div>
      </div>

      <div className="admin-orders__filters" role="search" aria-label="Customer search">
        <div className="admin-orders__search-wrap">
          <Search className="admin-orders__search-icon" size={18} aria-hidden />
          <input
            type="search"
            className="admin-orders__search"
            placeholder="Name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search customers"
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-dashboard--loading" style={{ minHeight: '12rem' }}>
          <LoadingSpinner label="Loading customers" />
        </div>
      ) : customers.length === 0 ? (
        <p className="admin-orders__empty">
          {debouncedSearch.trim()
            ? 'No customers match the current search.'
            : 'No customer accounts yet.'}
        </p>
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap">
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Verified</th>
                <th>Account</th>
                <th>Joined</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((row) => (
                <tr key={String(row._id)}>
                  <td>
                    <span className="admin-products__name">{row.name || '—'}</span>
                  </td>
                  <td>{row.email || '—'}</td>
                  <td>{row.phone || '—'}</td>
                  <td>
                    <span className={row.isVerified ? 'admin-categories__pill is-on' : 'admin-categories__pill is-off'}>
                      {row.isVerified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={row.isActive !== false ? 'admin-categories__pill is-on' : 'admin-categories__pill is-off'}>
                      {row.isActive !== false ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td>{formatDate(row.createdAt)}</td>
                  <td>
                    <div className="admin-categories__actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setDetailId(String(row._id))}
                        title="View details"
                      >
                        <Eye size={14} aria-hidden /> View
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === String(row._id)}
                        onClick={() => handleBan(row)}
                        title={row.isActive !== false ? 'Ban customer' : 'Unban customer'}
                      >
                        <Ban size={14} aria-hidden />
                        {row.isActive !== false ? 'Ban' : 'Unban'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm admin-customers__btn-danger"
                        disabled={busyId === String(row._id)}
                        onClick={() => setDeleteRow(row)}
                        title="Delete customer and related data"
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="admin-orders__pagination">
          <span className="admin-orders__count">
            {totalCount} customer{totalCount === 1 ? '' : 's'}
            {totalPages > 0 ? ` · page ${page} of ${totalPages}` : ''}
          </span>
          <div className="admin-orders__page-nav">
            <button
              type="button"
              className="admin-products__page-nav"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className="admin-products__page-nav"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!detailId}
        onClose={() => !busyId && setDetailId(null)}
        title={c?.name ? `Customer — ${c.name}` : 'Customer'}
        hideCancel
        confirmLabel="Close"
        onConfirm={() => setDetailId(null)}
        className="max-w-lg"
      >
        {detailLoading ? (
          <p className="text-sm text-neutral-600">Loading…</p>
        ) : c ? (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto text-sm text-neutral-800">
            <dl className="grid grid-cols-[7rem_1fr] gap-x-2 gap-y-2">
              <dt className="text-neutral-500">Email</dt>
              <dd className="font-medium">{c.email}</dd>
              <dt className="text-neutral-500">Phone</dt>
              <dd>{c.phone || '—'}</dd>
              <dt className="text-neutral-500">Joined</dt>
              <dd>{formatDate(c.createdAt)}</dd>
              <dt className="text-neutral-500">Verified</dt>
              <dd>{c.isVerified ? 'Yes' : 'No'}</dd>
              <dt className="text-neutral-500">Status</dt>
              <dd>{c.isActive !== false ? 'Active' : 'Banned'}</dd>
              <dt className="text-neutral-500">Lifetime spend</dt>
              <dd className="font-semibold">{formatMoney(detail.totalSpent)}</dd>
            </dl>
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Orders</h3>
              {!detail.orders?.length ? (
                <p className="text-neutral-600">No orders yet.</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto border border-neutral-200 rounded-lg p-2">
                  {detail.orders.map((o) => (
                    <li key={String(o._id)} className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                      <Link to={`/admin/orders/${o._id}`} className="font-medium text-neutral-900 underline">
                        {orderIdShort(o._id)}
                      </Link>
                      <span className="text-neutral-500">{formatDate(o.createdAt)}</span>
                      <span className="w-full text-neutral-600 sm:w-auto">
                        {o.status} · {formatMoney(o.totalPrice)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-600">No data.</p>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteRow}
        onClose={() => !busyId && setDeleteRow(null)}
        title="Delete customer?"
        danger
        confirmLabel={busyId && deleteRow && busyId === String(deleteRow._id) ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
      >
        {deleteRow && (
          <p className="text-sm text-neutral-800">
            Permanently remove <strong>{deleteRow.name}</strong> ({deleteRow.email}), including their cart, wishlist,
            reviews, and orders. This cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
