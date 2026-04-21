import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { productImageUrl } from '../../lib/productImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';

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

export default function AccountDashboard() {
  const { user, checkAuth } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await ordersAPI.getMyOrders({ page: 1, limit: 3 });
        const d = res.data?.data;
        if (!cancelled) {
          setRecent(Array.isArray(d?.orders) ? d.orders : []);
          setTotalOrders(Number(d?.totalCount) || 0);
        }
      } catch (e) {
        if (!cancelled) {
          setRecent([]);
          setTotalOrders(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = String(user?.name || 'there').trim().split(/\s+/)[0];
  const addrCount = Array.isArray(user?.savedAddresses) ? user.savedAddresses.length : 0;
  const avatarLetter = String(user?.name || user?.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="account-dashboard">
      <div className="account-dashboard__hero card-like">
        <div className="account-dashboard__avatar-wrap">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="account-dashboard__avatar-img"
              width={96}
              height={96}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="account-dashboard__avatar-fallback" aria-hidden>
              {avatarLetter}
            </span>
          )}
        </div>
        <div>
          <h2 className="account-dashboard__welcome">Welcome back, {firstName}!</h2>
          <p className="account-dashboard__email">{user?.email}</p>
        </div>
      </div>

      <div className="account-dashboard__stats">
        <div className="account-stat card-like">
          <div className="account-stat__value">{loading ? '—' : totalOrders}</div>
          <div className="account-stat__label">Total orders</div>
          <Link to="/account/orders" className="account-stat__link">
            View all
          </Link>
        </div>
        <div className="account-stat card-like">
          <div className="account-stat__value">{wishlistCount}</div>
          <div className="account-stat__label">Wishlist items</div>
          <Link to="/account/wishlist" className="account-stat__link">
            Open wishlist
          </Link>
        </div>
        <div className="account-stat card-like">
          <div className="account-stat__value">{addrCount}</div>
          <div className="account-stat__label">Saved addresses</div>
          <Link to="/account/addresses" className="account-stat__link">
            Manage
          </Link>
        </div>
      </div>

      <section className="account-dashboard__recent">
        <div className="account-section-head">
          <h3>Recent orders</h3>
          <Link to="/account/orders" className="btn btn-outline btn-sm">
            All orders
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner label="Loading orders" />
        ) : recent.length === 0 ? (
          <p className="empty-products-hint">
            No orders yet.{' '}
            <Link to="/shop" className="btn btn-primary btn-sm">
              Start shopping
            </Link>
          </p>
        ) : (
          <div className="account-table-wrap">
            <table className="account-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order._id}>
                    <td>#{orderShortId(order)}</td>
                    <td>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <div className="account-orders__thumbs">
                        {(order.orderItems || []).slice(0, 3).map((line, i) => {
                          const src = lineThumb(line);
                          return src ? (
                            <img
                              key={`${order._id}-t-${i}`}
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
                              key={`${order._id}-p-${i}`}
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
        )}
      </section>
    </div>
  );
}
