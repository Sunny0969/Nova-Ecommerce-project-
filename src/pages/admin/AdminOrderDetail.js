import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { adminAPI } from '../../api/adminApi';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import { downloadOrderPdf } from '../../lib/downloadOrderPdf';
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

const STATUS_LABELS = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  flagged: 'Under review',
  rejected: 'Rejected'
};

function resolveNotifyEmail(order) {
  if (!order) return '';
  const u = order.user;
  const account = typeof u === 'object' && u?.email ? String(u.email).trim() : '';
  const checkout = order.shippingAddress?.email ? String(order.shippingAddress.email).trim() : '';
  return checkout || account || '';
}

function toastForEmailResult(res, fallbackSuccess) {
  const d = res.data?.data;
  const msg = res.data?.message || fallbackSuccess;
  if (d?.emailNotified) {
    toast.success(msg);
    return;
  }
  if (d?.emailReason === 'no_email') {
    toast(msg, { icon: '⚠️' });
    return;
  }
  if (d?.emailReason === 'not_configured' || d?.emailReason === 'railway_smtp_blocked') {
    toast.error('Status saved but emails are not configured on the server (RESEND_API_KEY).');
    return;
  }
  if (d?.emailSkipped && d?.emailReason) {
    toast(msg, { icon: 'ℹ️' });
    return;
  }
  toast.success(fallbackSuccess);
}

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
  const [cancelReasonDraft, setCancelReasonDraft] = useState('');
  const [trackingDraft, setTrackingDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingPaid, setSavingPaid] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminAPI.orders.getOne(id);
      const o = res.data?.data?.order;
      setOrder(o || null);
      if (o) {
        setStatusDraft(o.status || 'pending');
        setCancelReasonDraft(o.cancelReason || '');
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
    if (statusDraft === order.status) {
      toast('Status is already "' + statusDraft + '" — pick a different status to notify the customer.', {
        icon: 'ℹ️'
      });
      return;
    }
    setSavingStatus(true);
    try {
      const body = { status: statusDraft };
      if (statusDraft === 'cancelled' && cancelReasonDraft.trim()) {
        body.cancelReason = cancelReasonDraft.trim();
      }
      const res = await adminAPI.orders.updateStatus(order._id, body);
      const updated = res.data?.data?.order || order;
      setOrder(updated);
      setStatusDraft(updated.status || statusDraft);
      if (updated.cancelReason) setCancelReasonDraft(updated.cancelReason);
      toastForEmailResult(res, 'Status updated');
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
      toastForEmailResult(res, 'Tracking saved');
    } catch (e) {
      toast.error(apiMessage(e, 'Could not save tracking'));
    } finally {
      setSavingTracking(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!order) return;
    setDownloadingPdf(true);
    try {
      await downloadOrderPdf(order);
      toast.success('Order PDF downloaded (A3)');
    } catch (e) {
      console.error(e);
      toast.error('Could not generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleMarkPaid = async (paid) => {
    if (!order?._id) return;
    setSavingPaid(true);
    try {
      const res = await adminAPI.orders.markPaid(order._id, { isPaid: paid });
      setOrder(res.data?.data?.order || order);
      if (res.data?.data?.order?.status) setStatusDraft(res.data.data.order.status);
      toastForEmailResult(res, paid ? 'Marked as paid' : 'Marked as unpaid');
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
  const notifyEmail = resolveNotifyEmail(order);
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
        <div className="admin-order-detail__head-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm admin-order-detail__download"
            disabled={downloadingPdf}
            onClick={handleDownloadPdf}
          >
            <Download size={16} strokeWidth={2} aria-hidden />
            {downloadingPdf ? 'Preparing…' : 'Download PDF (A3)'}
          </button>
          <span className={`admin-order-detail__status admin-order-detail__status--${order.status}`}>
            {order.status}
          </span>
        </div>
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
          <p className="admin-order-detail__muted admin-order-detail__notify-hint">
            {notifyEmail ? (
              <>
                Customer is emailed automatically on every status change to{' '}
                <a href={`mailto:${notifyEmail}`}>{notifyEmail}</a>
              </>
            ) : (
              <span className="admin-order-detail__alert admin-order-detail__alert--warn">
                No customer email on this order — status emails cannot be sent.
              </span>
            )}
          </p>
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
                {STATUS_LABELS[s] || s}
              </option>
            ))}
          </select>
          {statusDraft === 'cancelled' ? (
            <>
              <label className="form-label" htmlFor="admin-order-cancel-reason" style={{ marginTop: '0.75rem' }}>
                Cancellation reason (included in customer email)
              </label>
              <textarea
                id="admin-order-cancel-reason"
                className="form-control"
                rows={3}
                value={cancelReasonDraft}
                onChange={(e) => setCancelReasonDraft(e.target.value)}
                placeholder="Optional — e.g. Out of stock, customer request"
              />
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-primary btn-sm admin-order-detail__save"
            disabled={savingStatus || statusDraft === order.status}
            onClick={handleStatusSave}
          >
            {savingStatus ? 'Saving…' : 'Update status & email customer'}
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
            className="btn btn-outline btn-sm admin-order-detail__save admin-order-detail__btn-outline"
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
