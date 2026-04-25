import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const LIMIT = 20;

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' }
];

function countOrderUnits(orderItems) {
  if (!Array.isArray(orderItems)) return 0;
  return orderItems.reduce((sum, line) => sum + (Number(line?.quantity) || 0), 0);
}

function orderIdLabel(id) {
  if (!id) return '—';
  const s = String(id);
  if (s.length <= 8) return s;
  return `…${s.slice(-8)}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status, dateFrom, dateTo, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (status) params.status = status;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await adminAPI.orders.list(params);
      const d = res.data?.data;
      setOrders(Array.isArray(d?.orders) ? d.orders : []);
      setTotalCount(Number(d?.totalCount) || 0);
      setTotalPages(Number(d?.totalPages) || 0);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load orders'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-orders">
      <div className="admin-orders__head">
        <div>
          <h1 className="admin-dashboard__title">Orders</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Filter and search; open a row for full order details.
          </p>
        </div>
      </div>

      <div className="admin-orders__filters" role="search" aria-label="Order filters">
        <div className="admin-orders__status-tabs" role="tablist" aria-label="Status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={`admin-orders__status-tab${status === tab.value ? ' is-active' : ''}`}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-orders__range">
          <label className="admin-orders__range-label">
            <span>From</span>
            <input
              type="date"
              className="admin-orders__date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Created from date"
            />
          </label>
          <label className="admin-orders__range-label">
            <span>To</span>
            <input
              type="date"
              className="admin-orders__date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Created to date"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="admin-orders__clear-dates"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Clear dates
            </button>
          )}
        </div>

        <div className="admin-orders__search-wrap">
          <Search className="admin-orders__search-icon" size={18} aria-hidden />
          <input
            type="search"
            className="admin-orders__search"
            placeholder="Order ID, customer name or email, tracking…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search orders"
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-dashboard--loading" style={{ minHeight: '12rem' }}>
          <LoadingSpinner label="Loading orders" />
        </div>
      ) : orders.length === 0 ? (
        <p className="admin-orders__empty">No orders match the current filters.</p>
      ) : (
        <div className="admin-orders__table-wrap">
          <table className="admin-table admin-orders__table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const id = o._id;
                const u = o.user;
                const name = typeof u === 'object' && u != null ? u.name || '—' : '—';
                const email = typeof u === 'object' && u != null ? u.email || '' : '';
                const units = countOrderUnits(o.orderItems);
                const lineCount = Array.isArray(o.orderItems) ? o.orderItems.length : 0;
                return (
                  <tr key={String(id)}>
                    <td>
                      <Link
                        to={`/admin/orders/${id}`}
                        className="admin-table__link"
                        title={String(id)}
                      >
                        {orderIdLabel(id)}
                      </Link>
                    </td>
                    <td>
                      <div className="admin-orders__customer">
                        <span className="admin-orders__customer-name">{name}</span>
                        {email ? (
                          <span className="admin-orders__customer-email">{email}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span
                        className="admin-orders__items"
                        title={
                          lineCount
                            ? `${lineCount} line item${lineCount === 1 ? '' : 's'} · ${units} unit${
                                units === 1 ? '' : 's'
                              }`
                            : undefined
                        }
                      >
                        {units}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="admin-orders__pagination">
          <span className="admin-orders__count">
            {totalCount} order{totalCount === 1 ? '' : 's'}
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
    </div>
  );
}
