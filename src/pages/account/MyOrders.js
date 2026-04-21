import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../api/axios';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPKR } from '../../utils/currency';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' }
];

function orderShortId(order) {
  if (!order?._id) return '—';
  return String(order._id).slice(-8).toUpperCase();
}

function statusClass(status) {
  return `account-status-badge account-status-badge--${status || 'pending'}`;
}

function lineThumb(line) {
  const p = line.product;
  if (p && typeof p === 'object') {
    const u = productImageUrl(p);
    if (u) return u;
  }
  if (line.image) return line.image;
  return '';
}

export default function MyOrders() {
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (status) params.status = status;
      const res = await ordersAPI.getMyOrders(params);
      const list = res.data?.data?.orders;
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load orders'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="account-page account-orders">
      <h2 className="account-page__title">My orders</h2>

      <div className="account-orders__tabs" role="tablist" aria-label="Filter by status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id || 'all'}
            type="button"
            role="tab"
            aria-selected={status === t.id}
            className={`account-orders__tab${status === t.id ? ' is-active' : ''}`}
            onClick={() => setStatus(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading orders" />
      ) : orders.length === 0 ? (
        <p className="empty-products-hint">
          No orders in this view.{' '}
          <Link to="/shop" className="btn btn-primary btn-sm">
            Shop
          </Link>
        </p>
      ) : (
        <>
          <div className="account-table-wrap account-orders__table-desktop">
            <table className="account-table account-orders__table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{orderShortId(order)}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <div className="account-orders__thumbs">
                        {(order.orderItems || []).slice(0, 4).map((line, i) => {
                          const src = lineThumb(line);
                          return src ? (
                            <img
                              key={`${order._id}-img-${i}`}
                              src={src}
                              alt=""
                              className="account-orders__thumb"
                              width={48}
                              height={48}
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span
                              key={`${order._id}-ph-${i}`}
                              className="account-orders__thumb account-orders__thumb--placeholder"
                              aria-hidden
                            >
                              ·
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>{formatPKR(Number(order.totalPrice || 0))}</td>
                    <td>
                      <span className={statusClass(order.status)}>{order.status}</span>
                    </td>
                    <td className="account-table__actions">
                      <Link
                        to={`/account/orders/${order._id}`}
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="account-orders__cards">
            {orders.map((order) => (
              <li key={order._id} className="account-orders__card card-like">
                <div className="account-orders__card-head">
                  <span className="account-orders__card-id">#{orderShortId(order)}</span>
                  <span className={statusClass(order.status)}>{order.status}</span>
                </div>
                <div className="account-orders__card-meta">
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                  <span className="account-orders__card-total">
                    {formatPKR(Number(order.totalPrice || 0))}
                  </span>
                </div>
                <div className="account-orders__thumbs">
                  {(order.orderItems || []).slice(0, 6).map((line, i) => {
                    const src = lineThumb(line);
                    return src ? (
                      <img
                        key={`c-${order._id}-${i}`}
                        src={src}
                        alt=""
                        className="account-orders__thumb"
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span
                        key={`c-${order._id}-${i}`}
                        className="account-orders__thumb account-orders__thumb--placeholder"
                        aria-hidden
                      >
                        ·
                      </span>
                    );
                  })}
                </div>
                <Link
                  to={`/account/orders/${order._id}`}
                  className="btn btn-primary btn-sm btn-full"
                >
                  View order
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
