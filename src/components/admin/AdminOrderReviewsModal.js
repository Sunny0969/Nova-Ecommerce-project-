import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { productsAPI } from '../../api/storefront';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import { REVIEW_TOPICS, reviewTopicLabel } from '../../lib/reviewTopics';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import StarRating from '../StarRating';
import { formatPKR } from '../../utils/currency';

function orderShortId(order) {
  if (!order?._id) return '—';
  return String(order._id).slice(-8).toUpperCase();
}

function lineImage(line) {
  const p = line?.product;
  if (p && typeof p === 'object') {
    const u = productImageUrl(p);
    if (u) return u;
  }
  return line?.image || '';
}

function customerName(order) {
  const u = order?.user;
  if (u && typeof u === 'object') return u.name || '—';
  return '—';
}

function customerEmail(order) {
  const u = order?.user;
  if (u && typeof u === 'object') return u.email || '';
  return '';
}

export default function AdminOrderReviewsModal({ orderId, isOpen, onClose, onChanged }) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [itemReviews, setItemReviews] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [rating, setRating] = useState(5);
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await adminAPI.orders.getReviews(orderId);
      const data = res.data?.data;
      setOrder(data?.order || null);
      setItemReviews(Array.isArray(data?.itemReviews) ? data.itemReviews : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load reviews'));
      setOrder(null);
      setItemReviews([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    setEditRow(null);
    setDeleteRow(null);
    load();
  }, [isOpen, orderId, load]);

  const openEdit = (row) => {
    if (!row?.hasReview) return;
    setEditRow(row);
    setRating(Number(row.rating) || 5);
    setTopic(row.topic || '');
    setComment(row.comment || '');
  };

  const saveEdit = async () => {
    if (!editRow?.productId || !editRow?.reviewId) return;
    if (!rating || rating < 1) {
      toast.error('Please select a star rating');
      return;
    }
    if (!topic) {
      toast.error('Please choose a topic');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a review description');
      return;
    }

    setSaving(true);
    try {
      await productsAPI.updateReview(editRow.productId, editRow.reviewId, {
        rating: Math.round(Number(rating)),
        topic,
        comment: comment.trim()
      });
      toast.success('Review updated');
      setEditRow(null);
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update review'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow?.productId || !deleteRow?.reviewId) return;
    setDeleting(true);
    try {
      await productsAPI.deleteReview(deleteRow.productId, deleteRow.reviewId);
      toast.success('Review deleted');
      setDeleteRow(null);
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete review'));
    } finally {
      setDeleting(false);
    }
  };

  const reviewedLines = itemReviews.filter((row) => row.hasReview);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => !saving && !deleting && onClose?.()}
        title={order ? `Order #${orderShortId(order)} — Reviews` : 'Order reviews'}
        hideCancel
        confirmLabel="Close"
        onConfirm={() => onClose?.()}
        className="max-w-2xl admin-order-reviews-modal"
      >
        {loading ? (
          <LoadingSpinner label="Loading reviews" />
        ) : !order ? (
          <p className="admin-order-reviews-modal__empty">Order not found.</p>
        ) : (
          <div className="admin-order-reviews-modal__body">
            <section className="admin-order-reviews-modal__order">
              <h3 className="admin-order-reviews-modal__section-title">Order details</h3>
              <dl className="admin-order-reviews-modal__meta">
                <div>
                  <dt>Customer</dt>
                  <dd>
                    {customerName(order)}
                    {customerEmail(order) ? (
                      <>
                        <br />
                        <span className="admin-order-reviews-modal__email">{customerEmail(order)}</span>
                      </>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{order.status || '—'}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatPKR(Number(order.totalPrice) || 0)}</dd>
                </div>
                <div>
                  <dt>Placed</dt>
                  <dd>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="admin-order-reviews-modal__items">
              <h3 className="admin-order-reviews-modal__section-title">
                Items &amp; reviews
              </h3>
              {reviewedLines.length === 0 ? (
                <p className="admin-order-reviews-modal__empty">
                  No customer reviews for this order yet.
                </p>
              ) : (
                <ul className="admin-order-reviews-modal__list">
                  {itemReviews.map((row, i) => {
                    const line = (order.orderItems || []).find((l) => {
                      const p = l?.product;
                      const pid =
                        p && typeof p === 'object' && p._id
                          ? String(p._id)
                          : p != null
                            ? String(p)
                            : '';
                      return pid && pid === String(row.productId);
                    });
                    const img = line ? lineImage(line) : '';

                    return (
                      <li key={row.productId || i} className="admin-order-reviews-modal__item">
                        <div className="admin-order-reviews-modal__item-head">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="admin-order-reviews-modal__thumb"
                              width={56}
                              height={56}
                            />
                          ) : null}
                          <div className="admin-order-reviews-modal__item-info">
                            <strong>{row.productName || line?.name || 'Product'}</strong>
                            {row.hasReview ? (
                              <span className="admin-order-reviews-modal__rating">
                                <Star size={14} aria-hidden />
                                {row.rating}/5
                                {row.createdAt
                                  ? ` · ${new Date(row.createdAt).toLocaleDateString()}`
                                  : ''}
                              </span>
                            ) : (
                              <span className="admin-order-reviews-modal__no-review">No review</span>
                            )}
                          </div>
                          {row.hasReview ? (
                            <div className="admin-order-reviews-modal__item-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => openEdit(row)}
                              >
                                <Pencil size={14} aria-hidden />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm admin-order-reviews-modal__delete"
                                onClick={() => setDeleteRow(row)}
                              >
                                <Trash2 size={14} aria-hidden />
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {row.hasReview ? (
                          <div className="admin-order-reviews-modal__review-body">
                            <p>
                              <span className="admin-order-reviews-modal__label">Topic:</span>{' '}
                              {reviewTopicLabel(row.topic) || row.topic || '—'}
                            </p>
                            <p className="admin-order-reviews-modal__comment">{row.comment}</p>
                            {Array.isArray(row.images) && row.images.length > 0 ? (
                              <div className="admin-order-reviews-modal__photos">
                                {row.images.map((imgRow, j) =>
                                  imgRow?.url ? (
                                    <a
                                      key={imgRow.publicId || j}
                                      href={imgRow.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img src={imgRow.url} alt="" width={72} height={72} />
                                    </a>
                                  ) : null
                                )}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editRow)}
        onClose={() => !saving && setEditRow(null)}
        title="Edit customer review"
        confirmLabel={saving ? 'Saving…' : 'Save changes'}
        onConfirm={() => {
          if (!saving) saveEdit();
        }}
        className="max-w-lg"
      >
        {editRow ? (
          <div className="product-review-modal">
            <p className="admin-order-reviews-modal__edit-product">{editRow.productName}</p>
            <label className="account-form__label">Rating</label>
            <StarRating mode="interactive" value={rating} onChange={setRating} disabled={saving} />
            <label className="account-form__label" htmlFor="admin-edit-review-topic">
              Topic
            </label>
            <select
              id="admin-edit-review-topic"
              className="account-form__input product-review-modal__select"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={saving}
            >
              <option value="">Select an option</option>
              {REVIEW_TOPICS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <label className="account-form__label" htmlFor="admin-edit-review-comment">
              Description
            </label>
            <textarea
              id="admin-edit-review-comment"
              className="account-form__input product-review-modal__textarea"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={saving}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={Boolean(deleteRow)}
        onClose={() => !deleting && setDeleteRow(null)}
        title="Delete this review?"
        danger
        confirmLabel={deleting ? 'Deleting…' : 'Delete review'}
        onConfirm={() => {
          if (!deleting) confirmDelete();
        }}
      >
        <p>
          This will permanently remove the customer&apos;s review for{' '}
          <strong>{deleteRow?.productName || 'this product'}</strong>.
        </p>
      </Modal>
    </>
  );
}
