import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import SEO from '../components/SEO';
import { ordersAPI } from '../api/orders';
import { apiMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import BrandLogoLoader from '../components/BrandLogoLoader';
import { formatPKR } from '../utils/currency';
import { trackPurchase } from '../lib/metaPixel';
import { resolveOrderPurchaseValue } from '../lib/orderPurchaseValue';
import { EASYPAISA_NUMBER } from '../config/payments';
import { resolvePaymentProof } from '../utils/orderPaymentProof';

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
  const location = useLocation();
  const guestOrder = location.state?.guestOrder;
  const { isAuthenticated, canAccessCustomerApp } = useAuth();
  const showAccountOrders = Boolean(isAuthenticated && canAccessCustomerApp);
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

      if (guestOrder && String(guestOrder._id) === String(id)) {
        setOrder(guestOrder);
        setError(null);
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
          if (guestOrder) {
            setOrder(guestOrder);
            setError(null);
          } else {
            setError(apiMessage(e, 'Could not load order'));
            setOrder(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, guestOrder]);

  useEffect(() => {
    if (!order?._id) return;
    if (resolveOrderPurchaseValue(order) <= 0) return;
    trackPurchase(order);
  }, [order]);

  if (loading) {
    return (
      <div className="section container order-confirm order-confirm--loading">
        <SEO
          noIndex
          title="Order confirmation"
          description="Loading your Bazaar order confirmation."
          canonicalUrl={id ? `/order-confirmation/${id}` : '/order-confirmation'}
        />
        <BrandLogoLoader label="Loading order" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="section container text-center order-confirm">
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
          {showAccountOrders ? (
            <Link to="/account/orders" className="btn btn-outline">
              View My Orders
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const orderNo = formatOrderNo(order);
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const isPaid = Boolean(order.isPaid);
  const paymentId = order.paymentResult?.id || '';
  const isBankTransfer =
    paymentId === 'bank_transfer' ||
    /easypaisa|bank transfer/i.test(String(order.paymentMethod || '')) ||
    String(order.notes || '').toLowerCase().includes('easypaisa');
  const totalLabel = isPaid ? 'Total paid' : 'Order total';
  const proof = resolvePaymentProof(order);
  const proofSubmitted = proof.hasProof;
  const guestEmail =
    order?.shippingAddress?.email ||
    order?.paymentResult?.email_address ||
    '';
  const guestRegisterUrl = guestEmail
    ? `/login?activate=1&email=${encodeURIComponent(String(guestEmail).trim())}&next=${encodeURIComponent('/account/orders')}`
    : '/login?activate=1&next=%2Faccount%2Forders';

  return (
    <div className="section container order-confirm">
      <SEO
        noIndex
        title={`Order #${orderNo} confirmed`}
        description={`Your Bazaar order #${orderNo} is confirmed. Thank you for your purchase.`}
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

      {!isPaid ? (
        <div className="order-confirm__payment card-like">
          <h2 className="order-confirm__payment-title">Payment instructions</h2>
          {isBankTransfer ? (
            <>
              <p className="order-confirm__payment-text">
                Send <strong>{formatPKR(Number(order.totalPrice || 0))}</strong> via Easypaisa to{' '}
                <strong>{EASYPAISA_NUMBER}</strong>. We will confirm your order after verifying
                payment.
              </p>
              {proofSubmitted ? (
                <p className="order-confirm__payment-note order-confirm__payment-note--ok">
                  {proof.transactionId ? (
                    <>
                      Transaction ID received: <strong>{proof.transactionId}</strong>
                      <br />
                    </>
                  ) : null}
                  {proof.imageUrl ? 'Payment screenshot received. ' : null}
                  Our team will verify and update your order status.
                </p>
              ) : null}
            </>
          ) : (
            <p className="order-confirm__payment-text">
              Pay <strong>{formatPKR(Number(order.totalPrice || 0))}</strong> in cash when your
              order is delivered.
            </p>
          )}
          {order.notes ? (
            <p className="order-confirm__payment-note">{order.notes}</p>
          ) : null}
        </div>
      ) : null}

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
          <span>{totalLabel}</span>
          <span>{formatPKR(Number(order.totalPrice || 0))}</span>
        </div>
      </div>

      <div className="order-confirm__actions">
        <Link to="/shop" className="btn btn-primary">
          Continue Shopping
        </Link>
        {showAccountOrders ? (
          <Link to="/account/orders" className="btn btn-outline">
            View My Orders
          </Link>
        ) : (
          <Link to={guestRegisterUrl} className="btn btn-outline">
            Track orders — set password
          </Link>
        )}
      </div>
    </div>
  );
}
