import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';
import { EASYPAISA_NUMBER } from '../../config/payments';
import { resolvePaymentProof, isBankTransferOrder } from '../../utils/orderPaymentProof';

const STATUS_OPTIONS = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'flagged',
  'rejected'
];

function orderIdLabel(id) {
  if (!id) return '—';
  const s = String(id);
  return s.length <= 8 ? s.toUpperCase() : `…${s.slice(-8).toUpperCase()}`;
}

function paymentBadge(order) {
  const method = order.paymentMethod || '—';
  const paid = order.isPaid ? 'Paid' : 'Unpaid';
  const bt = isBankTransferOrder(order);
  const proof = resolvePaymentProof(order);
  const proofBit = bt ? (proof.hasProof ? ' · Proof ✓' : ' · Proof pending') : '';
  return `${method} · ${paid}${proofBit}`;
}

export default function AdminOrderDetail({ basePath = '/admin' }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDraft, setStatusDraft] = useState('pending');
  const [trackingDraft, setTrackingDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingPaid, setSavingPaid] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminAPI.orders.getOne(id);
      const o = res.data?.data?.order;
      setOrder(o || null);
      if (o) {
        setStatusDraft(o.status || 'pending');
        setTrackingDraft(o.trackingNumber || '');
      }
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load order'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusSave = async () => {
    if (!order?._id) return;
    setSavingStatus(true);
    try {
      const res = await adminAPI.orders.updateStatus(order._id, { status: statusDraft });
      setOrder(res.data?.data?.order || order);
      toast.success('Status updated');
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update status'));
    } finally {
      setSavingStatus(false);
    }
  };

  const handleTrackingSave = async () => {
    if (!order?._id || !trackingDraft.trim()) {
      toast.error('Enter a tracking number');
      return;
    }
    setSavingTracking(true);
    try {
      const res = await adminAPI.orders.updateTracking(order._id, {
        trackingNumber: trackingDraft.trim()
      });
      setOrder(res.data?.data?.order || order);
      toast.success('Tracking saved — customer notified');
    } catch (e) {
      toast.error(apiMessage(e, 'Could not save tracking'));
    } finally {
      setSavingTracking(false);
    }
  };

  const handleMarkPaid = async (paid) => {
    if (!order?._id) return;
    setSavingPaid(true);
    try {
      const res = await adminAPI.orders.markPaid(order._id, { isPaid: paid });
      setOrder(res.data?.data?.order || order);
      toast.success(paid ? 'Marked as paid' : 'Marked as unpaid');
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update payment'));
    } finally {
      setSavingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard--loading" style={{ minHeight: '14rem' }}>
        <LoadingSpinner label="Loading order" />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <p className="admin-orders__empty">Order not found.</p>
        <Link to={`${basePath}/orders`} className="btn btn-outline btn-sm">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const u = order.user;
  const customerName = typeof u === 'object' && u != null ? u.name || '—' : '—';
  const customerEmail = typeof u === 'object' && u != null ? u.email || '' : '';
  const addr = order.shippingAddress || {};
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const bankTransfer = isBankTransferOrder(order);
  const proof = resolvePaymentProof(order);

  return (
    <div className="admin-order-detail">
      <div className="admin-order-detail__head">
        <div>
          <Link to={`${basePath}/orders`} className="admin-order-detail__back">
            ← Orders
          </Link>
          <h1 className="admin-dashboard__title">Order {orderIdLabel(order._id)}</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Placed {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
          </p>
        </div>
        <span className={`admin-order-detail__status admin-order-detail__status--${order.status}`}>
          {order.status}
        </span>
      </div>

      <div className="admin-order-detail__grid">
        <section className="admin-order-detail__card card-like admin-order-detail__card--customer">
          <h2 className="admin-order-detail__card-title">Customer</h2>
          <p className="admin-order-detail__text">
            <strong>{customerName}</strong>
            {customerEmail ? (
              <>
                <br />
                <a href={`mailto:${customerEmail}`}>{customerEmail}</a>
              </>
            ) : null}
          </p>
          {addr.email && addr.email !== customerEmail ? (
            <p className="admin-order-detail__muted">Checkout email: {addr.email}</p>
          ) : null}

          <h3 className="admin-order-detail__subheading">Ship to</h3>
          <p className="admin-order-detail__text">
            {[addr.firstName, addr.lastName].filter(Boolean).join(' ') || customerName}
            <br />
            {addr.street}
            <br />
            {[addr.city, addr.state, addr.zipCode].filter(Boolean).join(', ')}
            <br />
            {addr.country}
            {addr.phone ? (
              <>
                <br />
                Tel: {addr.phone}
              </>
            ) : null}
          </p>
          <p className="admin-order-detail__muted">
            Delivery: <strong>{order.deliveryOption || 'standard'}</strong>
          </p>
        </section>

        <section className="admin-order-detail__card card-like admin-order-detail__card--payment">
          <h2 className="admin-order-detail__card-title">Payment</h2>
          <p className="admin-order-detail__text">{paymentBadge(order)}</p>

          {bankTransfer ? (
            <div className="admin-order-detail__proof">
              <h3 className="admin-order-detail__subheading">Customer payment proof</h3>
              <p className="admin-order-detail__muted admin-order-detail__easypaisa">
                Easypaisa account: <strong>{EASYPAISA_NUMBER}</strong>
              </p>

              {proof.transactionId ? (
                <div className="admin-order-detail__txn-box">
                  <span className="admin-order-detail__txn-label">Transaction ID (customer)</span>
                  <span className="admin-order-detail__txn">{proof.transactionId}</span>
                </div>
              ) : null}

              {proof.imageUrl ? (
                <a
                  href={proof.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-order-detail__proof-link"
                >
                  <img
                    src={proof.imageUrl}
                    alt="Customer payment screenshot"
                    className="admin-order-detail__proof-img"
                  />
                  <span>View payment screenshot</span>
                </a>
              ) : null}

              {!proof.hasProof ? (
                <p className="admin-order-detail__alert admin-order-detail__alert--warn">
                  Customer has not submitted a transaction ID or screenshot yet (checkout popup).
                </p>
              ) : null}

              {proof.submittedAt ? (
                <p className="admin-order-detail__muted">
                  Submitted {new Date(proof.submittedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="admin-order-detail__muted">
              {order.isPaid ? 'Payment received.' : 'Cash on delivery — mark paid after delivery if needed.'}
            </p>
          )}

          <div className="admin-order-detail__actions">
            {!order.isPaid ? (
              <button
                type="button"
                className="btn btn-gold admin-order-detail__btn-paid"
                disabled={savingPaid || (bankTransfer && !proof.hasProof)}
                title={
                  bankTransfer && !proof.hasProof
                    ? 'Waiting for customer transaction ID or screenshot'
                    : undefined
                }
                onClick={() => handleMarkPaid(true)}
              >
                {savingPaid ? 'Saving…' : 'Mark as paid'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm admin-order-detail__btn-outline"
                disabled={savingPaid}
                onClick={() => handleMarkPaid(false)}
              >
                Mark unpaid
              </button>
            )}
          </div>
        </section>

        <section className="admin-order-detail__card card-like admin-order-detail__card--wide">
          <h2 className="admin-order-detail__card-title">Line items</h2>
          <ul className="admin-order-detail__lines">
            {items.map((line, idx) => {
              const p = line.product;
              const img =
                typeof p === 'object' && p ? productImageUrl(p) : line.image || '';
              const lineTotal = (Number(line.price) || 0) * (Number(line.quantity) || 1);
              return (
                <li key={`${line.name}-${idx}`} className="admin-order-detail__line">
                  <div className="admin-order-detail__line-thumb">
                    {img ? <img src={img} alt="" /> : <span aria-hidden>📦</span>}
                  </div>
                  <div className="admin-order-detail__line-body">
                    <span className="admin-order-detail__line-name">{line.name}</span>
                    <span className="admin-order-detail__line-qty">
                      {formatPKR(line.price)} × {line.quantity}
                    </span>
                  </div>
                  <span className="admin-order-detail__line-total">{formatPKR(lineTotal)}</span>
                </li>
              );
            })}
          </ul>
          <div className="admin-order-detail__totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPKR(order.itemsPrice)}</span>
            </div>
            {Number(order.discountAmount) > 0 ? (
              <div className="summary-row checkout-summary__discount">
                <span>Discount</span>
                <span>−{formatPKR(order.discountAmount)}</span>
              </div>
            ) : null}
            <div className="summary-row">
              <span>Shipping</span>
              <span>{formatPKR(order.shippingPrice)}</span>
            </div>
            {Number(order.taxPrice) > 0 ? (
              <div className="summary-row">
                <span>Tax</span>
                <span>{formatPKR(order.taxPrice)}</span>
              </div>
            ) : null}
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPKR(order.totalPrice)}</span>
            </div>
          </div>
        </section>

        <section className="admin-order-detail__card card-like">
          <h2 className="admin-order-detail__card-title">Fulfillment</h2>
          <label className="form-label" htmlFor="admin-order-status">
            Status
          </label>
          <select
            id="admin-order-status"
            className="form-control"
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm admin-order-detail__save"
            disabled={savingStatus}
            onClick={handleStatusSave}
          >
            {savingStatus ? 'Saving…' : 'Update status'}
          </button>

          <label className="form-label" htmlFor="admin-order-tracking" style={{ marginTop: '1rem' }}>
            Tracking number
          </label>
          <input
            id="admin-order-tracking"
            className="form-control"
            value={trackingDraft}
            onChange={(e) => setTrackingDraft(e.target.value)}
            placeholder="Courier tracking ID"
          />
          <button
            type="button"
            className="btn btn-outline btn-sm admin-order-detail__save"
            disabled={savingTracking}
            onClick={handleTrackingSave}
          >
            {savingTracking ? 'Saving…' : 'Save tracking & notify'}
          </button>
        </section>
      </div>
    </div>
  );
}
