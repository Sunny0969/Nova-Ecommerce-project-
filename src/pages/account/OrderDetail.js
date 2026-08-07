import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { ordersAPI } from '../../api/orders';
import { authAPI } from '../../api/auth';
import { apiMessage } from '../../lib/api';
import {
  buildReviewMetaMap,
  lineProductId,
  mapUserReviewsByProduct
} from '../../lib/orderReviewStatus';
import { productImageUrl } from '../../lib/productImage';
import { useCart } from '../../context/CartContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import ProductReviewModal from '../../components/ProductReviewModal';
import SEO from '../../components/SEO';
import { formatPKR } from '../../utils/currency';
import { buildProductPath, getProductCategorySlug } from '../../utils/urls';

const STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
];

function orderShortId(order) {
  if (!order?._id) return '—';
  return String(order._id).slice(-8).toUpperCase();
}

function statusClass(status) {
  return `account-status-badge account-status-badge--${status || 'pending'}`;
}

function stepIndex(status) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function lineImage(line) {
  const p = line.product;
  if (p && typeof p === 'object') {
    const u = productImageUrl(p);
    if (u) return u;
  }
  return line.image || '';
}

function buildReviewTarget(line, meta) {
  const productId = lineProductId(line);
  if (!productId || meta?.hasReview) return null;
  return {
    productId,
    productName: line.name || meta?.productName || 'Product',
    productImage: lineImage(line),
    mode: 'create'
  };
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, fetchCart } = useCart();
  const [order, setOrder] = useState(null);
  const [itemReviews, setItemReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [buyAgainBusy, setBuyAgainBusy] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [userReviewsByProduct, setUserReviewsByProduct] = useState(() => new Map());

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, reviewsRes] = await Promise.all([
        ordersAPI.getOne(id),
        authAPI.myReviews().catch(() => null)
      ]);
      setOrder(orderRes.data?.data?.order || null);
      setItemReviews(
        Array.isArray(orderRes.data?.data?.itemReviews) ? orderRes.data.data.itemReviews : []
      );
      const list = reviewsRes?.data?.data?.reviews;
      setUserReviewsByProduct(mapUserReviewsByProduct(Array.isArray(list) ? list : []));
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load order'));
      setOrder(null);
      setItemReviews([]);
      setUserReviewsByProduct(new Map());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (loading || !order) return;
    if (searchParams.get('review') !== '1') return;

    setSearchParams({}, { replace: true });

    if (order.status !== 'delivered') {
      toast.error('Reviews are only available for delivered orders');
      return;
    }

    const metaMap = buildReviewMetaMap(order, itemReviews, userReviewsByProduct);
    const lines = order.orderItems || [];
    const targetLine = lines.find((line) => {
      const pid = lineProductId(line);
      return pid && metaMap.get(pid)?.canReview;
    });

    if (!targetLine) {
      toast('You have already reviewed all items in this order');
      return;
    }

    const meta = metaMap.get(lineProductId(targetLine));
    const target = buildReviewTarget(targetLine, meta);
    if (target) setReviewTarget(target);
  }, [loading, order, itemReviews, userReviewsByProduct, searchParams, setSearchParams]);

  const reviewMetaByProduct = useMemo(
    () => buildReviewMetaMap(order, itemReviews, userReviewsByProduct),
    [order, itemReviews, userReviewsByProduct]
  );

  const pendingReviewCount = useMemo(() => {
    let count = 0;
    reviewMetaByProduct.forEach((row) => {
      if (row.canReview) count += 1;
    });
    return count;
  }, [reviewMetaByProduct]);

  const handleCancel = async () => {
    if (!order?._id) return;
    setCancelling(true);
    try {
      await ordersAPI.cancel(order._id, {});
      toast.success('Order cancelled');
      setCancelOpen(false);
      navigate('/account/orders', { replace: true });
    } catch (e) {
      toast.error(apiMessage(e, 'Could not cancel order'));
    } finally {
      setCancelling(false);
    }
  };

  const handleBuyAgain = async () => {
    if (!order?.orderItems?.length) return;
    setBuyAgainBusy(true);
    try {
      let ok = 0;
      for (const line of order.orderItems) {
        const p = line.product;
        const ref = typeof p === 'object' && p?._id ? p : { _id: line.product };
        const product =
          typeof p === 'object' && p?._id
            ? {
                _id: p._id,
                name: p.name || line.name,
                price: Number(p.price ?? line.price) || 0,
                stock: p.stock,
                slug: p.slug,
                images: p.images
              }
            : {
                _id: ref._id,
                name: line.name,
                price: Number(line.price) || 0,
                images: line.image ? [{ url: line.image }] : []
              };
        const r = await addToCart(product, line.quantity || 1, { silent: true });
        if (r?.success) ok += 1;
      }
      await fetchCart();
      if (ok > 0) toast.success(`Added ${ok} line(s) to your cart`);
      else toast.error('Could not add items — check product availability');
    } finally {
      setBuyAgainBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="account-page">
        <SEO
          noIndex
          title="Order"
          description="Loading your order details. Private to your account."
        />
        <LoadingSpinner label="Loading order" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="account-page">
        <SEO
          noIndex
          title="Order not found"
          description="We could not find that order. Return to your order list in My Account."
        />
        <p className="empty-products-hint">We could not find this order.</p>
        <Link to="/account/orders" className="btn btn-outline">
          Back to orders
        </Link>
      </div>
    );
  }

  const idx = stepIndex(order.status);
  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';
  const showStepper = !cancelled;
  const canCancel = order.status === 'pending';

  const openReviewForLine = (line) => {
    const productId = lineProductId(line);
    if (!productId) return;
    const meta = reviewMetaByProduct.get(productId);
    if (meta?.hasReview) {
      toast('You have already reviewed this product');
      return;
    }
    const target = buildReviewTarget(line, meta);
    if (target) setReviewTarget(target);
  };

  return (
    <div className="account-page account-order-detail">
      <p className="account-order-detail__back">
        <Link to="/account/orders">← Back to orders</Link>
      </p>
      <div className="account-order-detail__head">
        <h2 className="account-page__title">Order #{orderShortId(order)}</h2>
        <span className={statusClass(order.status)}>{order.status}</span>
      </div>
      <p className="account-order-detail__date">
        Placed on{' '}
        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}
      </p>

      {cancelled && (
        <div className="account-order-detail__alert card-like" role="status">
          This order was cancelled.
          {order.cancelReason ? ` Reason: ${order.cancelReason}` : ''}
        </div>
      )}

      {showStepper && (
        <ol className="account-stepper" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              className={`account-stepper__step${i <= idx ? ' is-done' : ''}${
                i === idx ? ' is-current' : ''
              }`}
            >
              <span className="account-stepper__dot" aria-hidden />
              <span className="account-stepper__label">{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.trackingNumber ? (
        <div className="account-order-detail__tracking card-like">
          <strong>Tracking</strong>
          <code className="account-order-detail__tracking-code">{order.trackingNumber}</code>
        </div>
      ) : null}

      {delivered && pendingReviewCount > 0 ? (
        <div className="account-order-detail__review-banner card-like" role="status">
          <Star size={20} className="account-order-detail__review-icon" aria-hidden />
          <div>
            <strong>How was your order?</strong>
            <p>
              You can leave a star rating, review, and photos for{' '}
              {pendingReviewCount === 1 ? 'the item' : `${pendingReviewCount} items`} below.
            </p>
          </div>
        </div>
      ) : null}

      <div className="account-order-detail__grid">
        <section className="account-order-detail__items card-like">
          <h3 className="account-subheading">Items</h3>
          <ul className="account-order-lines">
            {(order.orderItems || []).map((line, i) => {
              const img = lineImage(line);
              const slug =
                typeof line.product === 'object' && line.product?.slug
                  ? line.product.slug
                  : null;
              const productRef = typeof line.product === 'object' ? line.product : null;
              const productId = lineProductId(line);
              const reviewMeta = productId ? reviewMetaByProduct.get(productId) : null;
              const inner = (
                <>
                  <div className="account-order-lines__img-wrap">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="account-order-lines__img"
                        width={72}
                        height={72}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="account-order-lines__placeholder" aria-hidden>
                        ·
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="account-order-lines__name">{line.name}</div>
                    <div className="account-order-lines__meta">
                      {formatPKR(Number(line.price || 0))} × {line.quantity}
                    </div>
                  </div>
                  <div className="account-order-lines__total">
                    {formatPKR(Number(line.price || 0) * Number(line.quantity || 1))}
                  </div>
                </>
              );
              return (
                <li key={`${line.name}-${i}`} className="account-order-lines__row">
                  <div className="account-order-lines__main">
                    {slug ? (
                      <Link
                        to={buildProductPath(slug, getProductCategorySlug(productRef))}
                        className="account-order-lines__link"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="account-order-lines__link account-order-lines__link--static">
                        {inner}
                      </div>
                    )}
                    {delivered && productId && reviewMeta?.hasReview ? (
                      <span
                        className="account-order-lines__reviewed-badge"
                        aria-label={`Reviewed ${reviewMeta.rating} out of 5 stars`}
                      >
                        <Star size={14} aria-hidden />
                        Reviewed
                        {reviewMeta.rating != null ? ` · ${reviewMeta.rating}/5` : ''}
                      </span>
                    ) : delivered && productId && reviewMeta?.canReview ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm account-order-lines__review-btn"
                        onClick={() => openReviewForLine(line)}
                      >
                        <Star size={14} aria-hidden />
                        Write review
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="account-order-detail__aside">
          <div className="card-like account-order-detail__breakdown">
            <h3 className="account-subheading">Summary</h3>
            <dl className="account-price-rows">
              <div className="account-price-row">
                <dt>Items</dt>
                <dd>{formatPKR(Number(order.itemsPrice || 0))}</dd>
              </div>
              {Number(order.taxPrice) > 0 ? (
                <div className="account-price-row">
                  <dt>Tax</dt>
                  <dd>{formatPKR(Number(order.taxPrice))}</dd>
                </div>
              ) : null}
              {Number(order.shippingPrice) > 0 ? (
                <div className="account-price-row">
                  <dt>Shipping</dt>
                  <dd>{formatPKR(Number(order.shippingPrice))}</dd>
                </div>
              ) : null}
              {Number(order.discountAmount) > 0 ? (
                <div className="account-price-row account-price-row--discount">
                  <dt>Discount</dt>
                  <dd>−{formatPKR(Number(order.discountAmount))}</dd>
                </div>
              ) : null}
              <div className="account-price-row account-price-row--total">
                <dt>Total</dt>
                <dd>{formatPKR(Number(order.totalPrice || 0))}</dd>
              </div>
            </dl>
          </div>

          <div className="card-like account-order-detail__ship">
            <h3 className="account-subheading">Shipping address</h3>
            <address className="account-address-block">
              {(order.shippingAddress?.firstName || order.shippingAddress?.lastName) && (
                <>
                  {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                  <br />
                </>
              )}
              {order.shippingAddress?.street}
              <br />
              {order.shippingAddress?.city}
              {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{' '}
              {order.shippingAddress?.zipCode}
              <br />
              {order.shippingAddress?.country}
              {order.shippingAddress?.phone ? (
                <>
                  <br />
                  {order.shippingAddress.phone}
                </>
              ) : null}
              {order.shippingAddress?.email ? (
                <>
                  <br />
                  {order.shippingAddress.email}
                </>
              ) : null}
            </address>
          </div>

          <div className="account-order-detail__actions">
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={handleBuyAgain}
              disabled={buyAgainBusy || cancelled}
            >
              {buyAgainBusy ? 'Adding…' : 'Buy again'}
            </button>
            {canCancel ? (
              <button
                type="button"
                className="btn btn-outline btn-full account-order-detail__cancel"
                onClick={() => setCancelOpen(true)}
              >
                Cancel order
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      <Modal
        isOpen={cancelOpen}
        onClose={() => !cancelling && setCancelOpen(false)}
        title="Cancel this order?"
        danger
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, cancel order'}
        onConfirm={() => {
          if (!cancelling) handleCancel();
        }}
      >
        <p>
          Eligible refunds will be credited to your Bazaar Wallet. This cannot be undone from your
          account.
        </p>
      </Modal>

      <ProductReviewModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        productId={reviewTarget?.productId}
        productName={reviewTarget?.productName}
        productImage={reviewTarget?.productImage}
        reviewId={reviewTarget?.reviewId}
        mode={reviewTarget?.mode}
        initialRating={reviewTarget?.initialRating}
        initialTopic={reviewTarget?.initialTopic}
        initialComment={reviewTarget?.initialComment}
        existingImages={reviewTarget?.existingImages}
        onSuccess={loadOrder}
      />
    </div>
  );
}
