import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import SEO from '../components/SEO';
import { ordersAPI } from '../api/axios';
import { apiMessage } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPKR } from '../utils/currency';

function formatOrderNo(order) {
  if (!order?._id) return '—';
  return String(order._id).slice(-8).toUpperCase();
}

function deliveryMessage(deliveryOption) {
  switch (deliveryOption) {
    case 'nextday':
      return 'We aim to dispatch the next working day for next-day delivery where available.';
    case 'express':
      return 'Estimated delivery: 1–2 business days after dispatch.';
    default:
      return 'Estimated delivery: 3–5 business days after dispatch.';
  }
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setError('Missing order reference');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await ordersAPI.getOne(id);
        const o = res.data?.data?.order;
        if (cancelled) return;
        if (!o) {
          setError('Order not found');
          setOrder(null);
        } else {
          setOrder(o);
        }
      } catch (e) {
        if (!cancelled) {
          setError(apiMessage(e, 'Could not load order'));
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="section container order-confirm order-confirm--loading" id="main-content">
        <SEO
          noIndex
          title="Order confirmation"
          description="Loading your Nova Shop order confirmation."
          canonicalUrl={id ? `/order-confirmation/${id}` : '/order-confirmation'}
        />
        <LoadingSpinner size="lg" label="Loading order" />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="section container text-center order-confirm" id="main-content">
        <SEO
          noIndex
          title="Order"
          description="We could not load this order. Return to the shop or your account orders."
          canonicalUrl={id ? `/order-confirmation/${id}` : '/order-confirmation'}
        />
        <h1 className="order-confirm__title">We couldn&apos;t load this order</h1>
        <p className="order-confirm__meta">{error || 'Order not found.'}</p>
        <div className="order-confirm__actions">
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link to="/account/orders" className="btn btn-outline">
            View My Orders
          </Link>
        </div>
      </main>
    );
  }

  const orderNo = formatOrderNo(order);
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  return (
    <main className="section container order-confirm" id="main-content">
      <SEO
        noIndex
        title={`Order #${orderNo} confirmed`}
        description={`Your Nova Shop order #${orderNo} is confirmed. Thank you for your purchase.`}
        canonicalUrl={`/order-confirmation/${id}`}
      />

      <div className="order-confirm__check" aria-hidden>
        <Check strokeWidth={2.5} />
      </div>
      <h1 className="order-confirm__title">Thank you — your order is confirmed</h1>
      <p className="order-confirm__meta">
        Order number <strong>#{orderNo}</strong>
      </p>
      <p className="order-confirm__email-note">
        A confirmation email has been sent to your inbox (if mail is configured on the server).
      </p>
      <p className="order-confirm__delivery">{deliveryMessage(order.deliveryOption)}</p>

      <div className="order-confirm__items">
        <div className="order-confirm__items-head">Order items</div>
        {items.map((line, idx) => (
          <div key={`${line.name}-${idx}`} className="order-confirm__item">
            <span className="order-confirm__item-name">
              {line.name} × {line.quantity}
            </span>
            <span>{formatPKR(Number(line.price) * Number(line.quantity || 1))}</span>
          </div>
        ))}
        <div className="order-confirm__item" style={{ fontWeight: 700, background: 'var(--cream)' }}>
          <span>Total paid</span>
          <span>{formatPKR(Number(order.totalPrice || 0))}</span>
        </div>
      </div>

      <div className="order-confirm__actions">
        <Link to="/shop" className="btn btn-primary">
          Continue Shopping
        </Link>
        <Link to="/account/orders" className="btn btn-outline">
          View My Orders
        </Link>
      </div>
    </main>
  );
}
