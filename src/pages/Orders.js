import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { ordersAPI } from 'api';
import { apiMessage } from '../lib/api';
import { formatPKR } from '../utils/currency';

export default function Orders({ embedded }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ordersAPI.getMyOrders({ page: 1, limit: 50 });
        const d = res.data?.data;
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) {
          toast.error(apiMessage(e, 'Could not load orders'));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const orders = data?.orders || [];

  const body = (
    <>
      {loading ? (
        <Skeleton count={6} />
      ) : orders.length === 0 ? (
        <p className="empty-products-hint">
          You have no orders yet.{' '}
          <Link to="/shop" className="btn btn-primary btn-sm">
            Start shopping
          </Link>
        </p>
      ) : (
        <ul className="orders-list">
          {orders.map((order) => (
            <li key={order._id} className="order-card card-like">
              <div className="order-card__head">
                <span className="order-id">Order #{String(order._id).slice(-8)}</span>
                <span className={`order-status order-status--${order.status}`}>{order.status}</span>
              </div>
              <div className="order-card__meta">
                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="order-total">{formatPKR(Number(order.totalPrice))}</span>
              </div>
              <ul className="order-lines">
                {(order.orderItems || []).map((line, i) => (
                  <li key={i}>
                    {line.name} × {line.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (embedded) {
    return (
      <>
        <SEO
          noIndex
          title="My orders"
          description="View your order history and delivery status at Nova Shop. Private to your account."
        />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Orders</h2>
        {body}
      </>
    );
  }

  return (
    <>
      <SEO
        noIndex
        title="My orders"
        description="Your Nova Shop order history — track past purchases and order status. Sign in required."
        canonicalUrl="/orders"
      />
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">My orders</h1>
          <p className="page-header__subtitle">Track deliveries and open past purchases.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li className="active" aria-current="page">
              Orders
            </li>
          </ol>
        </div>
      </header>
      <main className="section orders-page" id="main-content">
        <div className="container">{body}</div>
      </main>
    </>
  );
}
