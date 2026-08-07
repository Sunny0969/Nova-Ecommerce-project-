import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/auth';
import { productsAPI } from '../../api/storefront';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import Modal from '../../components/Modal';
import { REVIEW_TOPICS, reviewTopicLabel } from '../../lib/reviewTopics';
import { buildProductPath, getProductCategorySlug } from '../../utils/urls';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editReview, setEditReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [topic, setTopic] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteReview, setDeleteReview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.myReviews();
      const list = res.data?.data?.reviews;
      setReviews(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load reviews'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (r) => {
    setEditReview(r);
    setRating(Number(r.rating) || 5);
    setTopic(r.topic || '');
    setComment(r.comment || '');
  };

  const saveEdit = async () => {
    if (!editReview?.product?._id && !editReview?.product) return;
    const productId =
      typeof editReview.product === 'object'
        ? editReview.product._id
        : editReview.product;
    setSaving(true);
    try {
      await productsAPI.updateReview(productId, editReview._id, { rating, topic, comment });
      toast.success('Review updated');
      setEditReview(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not update review'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteReview?.product?._id) return;
    const productId = deleteReview.product._id;
    try {
      await productsAPI.deleteReview(productId, deleteReview._id);
      toast.success('Review deleted');
      setDeleteReview(null);
      await load();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete review'));
    }
  };

  return (
    <div className="account-page account-reviews">
      <h2 className="account-page__title">My reviews</h2>

      {loading ? (
        <p className="account-muted">Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="empty-products-hint">
          You have not written any reviews yet. Reviews appear after you rate a product you
          received.
        </p>
      ) : (
        <ul className="account-reviews__list">
          {reviews.map((r) => {
            const p = r.product;
            const slug = p?.slug;
            const img = productImageUrl(p || {});
            const name = p?.name || 'Product';
            return (
              <li key={r._id} className="account-review-card card-like">
                <div className="account-review-card__product">
                  <div className="account-review-card__img-wrap">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="account-review-card__img"
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="account-review-card__placeholder" aria-hidden>
                        ·
                      </span>
                    )}
                  </div>
                  <div>
                    {slug ? (
                      <Link
                        to={buildProductPath(slug, getProductCategorySlug(p))}
                        className="account-review-card__title"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="account-review-card__title">{name}</span>
                    )}
                    <div className="account-review-card__stars" aria-label={`${r.rating} of 5`}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={16}
                          strokeWidth={1.5}
                          className={
                            i <= Number(r.rating)
                              ? 'product-rating__star product-rating__star--fill'
                              : 'product-rating__star'
                          }
                          fill={i <= Number(r.rating) ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <time className="account-review-card__date" dateTime={r.createdAt}>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : ''}
                      {r.topic ? ` · ${reviewTopicLabel(r.topic)}` : ''}
                    </time>
                  </div>
                </div>
                {r.comment ? (
                  <p className="account-review-card__comment">{r.comment}</p>
                ) : (
                  <p className="account-review-card__comment account-review-card__comment--muted">
                    No written comment.
                  </p>
                )}
                {Array.isArray(r.images) && r.images.length > 0 ? (
                  <div className="account-review-card__images">
                    {r.images.map((img, idx) =>
                      img?.url ? (
                        <img
                          key={`${r._id}-img-${idx}`}
                          src={img.url}
                          alt=""
                          className="account-review-card__photo"
                          width={72}
                          height={72}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null
                    )}
                  </div>
                ) : null}
                <div className="account-review-card__actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => openEdit(r)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm account-review-card__delete"
                    onClick={() => setDeleteReview(r)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        isOpen={Boolean(editReview)}
        onClose={() => !saving && setEditReview(null)}
        title="Edit review"
        confirmLabel={saving ? 'Saving…' : 'Save'}
        onConfirm={() => {
          if (!saving) saveEdit();
        }}
      >
        <div className="account-review-edit">
          <label className="account-form__label">Rating</label>
          <select
            className="account-form__input"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
          <label className="account-form__label">Topic</label>
          <select
            className="account-form__input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">Select an option</option>
            {REVIEW_TOPICS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label className="account-form__label">Comment</label>
          <textarea
            className="account-form__input account-form__textarea"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
          />
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteReview)}
        onClose={() => setDeleteReview(null)}
        title="Delete review?"
        danger
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      >
        <p>This removes your review from the product.</p>
      </Modal>
    </div>
  );
}
