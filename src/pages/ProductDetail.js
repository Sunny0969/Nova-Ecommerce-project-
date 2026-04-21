import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Skeleton from 'react-loading-skeleton';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { getCanonicalUrl, buildBreadcrumbListSchema } from '../utils/seo';
import { productImageUrl } from '../lib/productImage';
import { apiMessage } from '../lib/api';
import { formatPKR } from '../utils/currency';
import ImageGallery from '../components/ImageGallery';
import NotFound from './NotFound';
import ProductImage from '../components/ProductImage';
import RecommendationRow from '../components/RecommendationRow';
import { eventsAPI, recommendationsAPI } from '../api/axios';
import { getSessionId } from '../lib/sessionId';
import StarRating from '../components/StarRating';
import { buildFakeReviews } from '../lib/fakeReviews';

function stripHtml(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = String(html);
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

function formatCategoryLabel(slug, name) {
  if (name && String(name).trim()) return String(name).trim();
  if (!slug) return 'Shop';
  return String(slug)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, products: wishProducts } = useWishlist();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyBanner, setNotifyBanner] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alsoBought, setAlsoBought] = useState([]);
  const [similar, setSimilar] = useState([]);

  // Must be declared before any early returns (hooks order).
  const fake = useMemo(() => buildFakeReviews(product), [product]);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setNotifyBanner(null);
    try {
      const res = await axios.get(`/api/products/${encodeURIComponent(slug)}`);
      const data = res.data?.data;
      if (data?.unavailable) {
        setProduct(data);
        return;
      }
      if (data) {
        setProduct(data);
        return;
      }
      setProduct(null);
      setNotFound(true);
    } catch (e) {
      setProduct(null);
      if (e.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(apiMessage(e, 'Could not load product'));
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    // log view + load product-page recommendations
    if (!product?._id || product?.unavailable) return;
    const sid = getSessionId();
    eventsAPI
      .log({
        sessionId: sid,
        productId: product._id,
        eventType: 'view',
        duration: 0,
        source: 'product'
      })
      .catch(() => {});

    recommendationsAPI
      .frequentlyBought(product._id, { limit: 10 })
      .then((r) => setAlsoBought(r.data?.data?.products || []))
      .catch(() => setAlsoBought([]));
    recommendationsAPI
      .similar(product._id, { limit: 10 })
      .then((r) => setSimilar(r.data?.data?.products || []))
      .catch(() => setSimilar([]));
  }, [product?._id, product?.unavailable]);

  useEffect(() => {
    setQty(1);
  }, [slug, product?._id]);

  useEffect(() => {
    setNotifyEmail('');
    setNotifyBanner(null);
  }, [slug]);

  const handleNotifyStock = async (e) => {
    e.preventDefault();
    if (!slug || !notifyEmail.trim()) return;
    setNotifySubmitting(true);
    setNotifyBanner(null);
    try {
      const res = await axios.post(`/api/products/${encodeURIComponent(slug)}/notify-stock`, {
        email: notifyEmail.trim()
      });
      const msg = res.data?.data?.message || 'Thanks — we will email you when this item is back in stock.';
      setNotifyBanner(msg);
      setNotifyEmail('');
      toast.success(msg);
    } catch (err) {
      const msg = apiMessage(err, 'Could not register your email');
      setNotifyBanner(msg);
      toast.error(msg);
    } finally {
      setNotifySubmitting(false);
    }
  };

  const inWishlist =
    product &&
    !product.unavailable &&
    wishProducts.some((p) => String(p._id || p) === String(product._id));

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product, qty);
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/shop/${encodeURIComponent(slug || '')}`;
  }, [slug]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const whatsappShare = () => {
    const text = `${product?.name || 'Product'} — ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const scrollToReviews = () => {
    setActiveTab('reviews');
    window.setTimeout(() => {
      document.getElementById('panel-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const compareAt = product?.originalPrice ?? product?.comparePrice;
  const price = product ? Number(product.price) : 0;
  const hasSale =
    product && compareAt != null && Number(compareAt) > price;
  const discountPct =
    hasSale && Number(compareAt) > 0
      ? Math.round(((Number(compareAt) - price) / Number(compareAt)) * 100)
      : null;

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images?.length > 0) return product.images;
    const u = productImageUrl(product);
    return u ? [{ url: u }] : [];
  }, [product]);

  const stockMax = useMemo(() => {
    if (!product) return 1;
    const s = product.stockQuantity;
    if (s == null || !Number.isFinite(Number(s))) return 99;
    return Math.max(0, Math.floor(Number(s)));
  }, [product]);

  const histogram = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.ratingHistogram) && product.ratingHistogram.length) {
      return product.ratingHistogram;
    }
    const map = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    (fake.reviews || []).forEach((r) => {
      const s = Math.round(Number(r.rating));
      if (s >= 1 && s <= 5) map[s] += 1;
    });
    return [5, 4, 3, 2, 1].map((stars) => ({ stars, count: map[stars] }));
  }, [product, fake.reviews]);

  const reviewTotal = useMemo(
    () => histogram.reduce((sum, row) => sum + (Number(row.count) || 0), 0),
    [histogram]
  );

  const productPath = useMemo(
    () => (slug ? `/shop/${encodeURIComponent(String(slug))}` : '/shop'),
    [slug]
  );
  const canonicalUrl = useMemo(() => getCanonicalUrl(productPath), [productPath]);

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const imgs = images.map((i) => i && i.url).filter(Boolean);
    const short = stripHtml(product.shortDescription || '');
    const long = stripHtml(product.description || '');
    const desc = (short || long || String(product.name || '')).trim().slice(0, 8000);
    const numReviews = Number(product.numReviews ?? product.ratingCount) || 0;
    const ratingValue = Number(product.ratings ?? product.rating) || 0;
    const stockN =
      product.stockQuantity != null && product.stockQuantity !== '' ? Number(product.stockQuantity) : null;
    const inStock = Boolean(product.inStock) || (stockN != null && !Number.isNaN(stockN) && stockN > 0);
    const withRating = numReviews > 0 && ratingValue > 0;
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: imgs.length ? imgs : undefined,
      description: desc,
      sku: product.sku != null && String(product.sku).trim() ? String(product.sku).trim() : undefined,
      brand: { '@type': 'Brand', name: 'Nova Shop' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PKR',
        price: String(price.toFixed(2)),
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: canonicalUrl
      },
      ...(withRating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: String(ratingValue.toFixed(1)),
              reviewCount: String(numReviews)
            }
          }
        : {})
    };
  }, [product, images, price, canonicalUrl]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!product || product.unavailable) return null;
    const catSlug = product.categorySlug || product.category;
    const catName = formatCategoryLabel(catSlug, product.categoryName);
    const pathCat =
      catSlug && String(catSlug)
        ? `/shop?category=${encodeURIComponent(String(catSlug))}`
        : null;
    const list = [
      { name: 'Home', path: '/' },
      { name: 'Shop', path: '/shop' }
    ];
    if (pathCat) {
      list.push({
        name: catName,
        url: getCanonicalUrl(pathCat)
      });
    }
    list.push({ name: product.name, path: productPath });
    return buildBreadcrumbListSchema(list);
  }, [product, productPath]);

  const structuredData = useMemo(() => {
    if (!productJsonLd || !breadcrumbJsonLd) return null;
    return [breadcrumbJsonLd, productJsonLd];
  }, [productJsonLd, breadcrumbJsonLd]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product?.reviewEligible || !product._id) return;
    setReviewSubmitting(true);
    try {
      await axios.post(
        `/api/products/${product._id}/reviews`,
        { rating: reviewRating, comment: reviewComment.trim() },
        { withCredentials: true }
      );
      toast.success('Thank you — your review was posted');
      setReviewComment('');
      setReviewRating(5);
      await loadProduct();
      setActiveTab('reviews');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not post review'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="section container product-detail-skeleton" id="main-content">
        <SEO
          title="Product"
          description="Loading product details at Nova Shop."
        />
        <div className="product-detail-grid">
          <Skeleton height={420} style={{ borderRadius: 12 }} />
          <div>
            <Skeleton count={5} />
          </div>
        </div>
      </main>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (!product) {
    return null;
  }

  if (product.unavailable) {
    const catSlugUn = product.categorySlug || product.category;
    const catNameUn = formatCategoryLabel(catSlugUn, product.categoryName);
    const metaUnavailable =
      stripHtml(product.shortDescription || product.description || '').slice(0, 160) ||
      `${product.name} is not available at Nova Shop.`;

    return (
      <>
        <SEO
          noIndex
          title={`${product.name} — Unavailable`}
          description={metaUnavailable}
          canonicalUrl={productPath}
        />
        <header className="page-header">
          <div className="container">
            <ol className="breadcrumb" aria-label="Breadcrumb">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/shop">Shop</Link>
              </li>
              {catSlugUn ? (
                <li>
                  <Link to={`/shop?category=${encodeURIComponent(catSlugUn)}`}>{catNameUn}</Link>
                </li>
              ) : null}
              <li className="active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </div>
        </header>

        <main className="section product-detail-page" id="main-content">
          <div className="container product-detail-unavailable">
            <div className="product-detail-grid">
              <div className="product-detail-gallery-col">
                <ImageGallery
                  images={images}
                  productName={product.name}
                  showSaleBadge={Boolean(hasSale)}
                />
              </div>
              <div className="product-detail-info">
                <p className="product-detail-category-link product-detail-category-link--text">{catNameUn}</p>
                <h1 className="product-detail-title">{product.name}</h1>
                <p className="product-detail-unavailable__badge" role="status">
                  Product unavailable
                </p>
                <p className="product-detail-unavailable__msg">
                  {product.message ||
                    'This product is not available for purchase right now. You can still explore similar items below.'}
                </p>
                <div className="product-detail-unavailable__actions">
                  <Link to="/shop" className="btn btn-primary">
                    Browse shop
                  </Link>
                  {catSlugUn ? (
                    <Link
                      to={`/shop?category=${encodeURIComponent(catSlugUn)}`}
                      className="btn btn-outline"
                    >
                      More in {catNameUn}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>

            {Array.isArray(product.relatedProducts) && product.relatedProducts.length > 0 ? (
              <section className="section related-products" aria-label="Related products">
                <div className="container">
                  <h2 className="related-products__title">You may also like</h2>
                  <div className="related-strip">
                    {product.relatedProducts.map((p) => {
                      const img = productImageUrl(p);
                      const pr = Number(p.price) || 0;
                      const ps = p.slug || p.productId;
                      return (
                        <Link key={p._id} to={`/shop/${encodeURIComponent(ps || '')}`} className="related-card">
                          <div className="related-card__img-wrap">
                            {img ? (
                              <ProductImage
                                src={img}
                                alt=""
                                className="related-card__img"
                                width={400}
                                height={400}
                              />
                            ) : (
                              <span className="related-card__emoji" aria-hidden>
                                {p.emoji || '📦'}
                              </span>
                            )}
                          </div>
                          <span className="related-card__name">{p.name}</span>
                          <span className="related-card__price">{formatPKR(pr)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </main>
      </>
    );
  }

  const categorySlug = product.categorySlug || product.category;
  const categoryName = formatCategoryLabel(categorySlug, product.categoryName);
  const reviewCount = fake.count;
  const ratingValue = fake.rating;

  const metaDesc =
    stripHtml(product.shortDescription || product.description || '').slice(0, 160) ||
    `${product.name} at Nova Shop`;

  return (
    <>
      <SEO
        title={product.name}
        description={metaDesc}
        canonicalUrl={productPath}
        ogType="product"
        ogImage={images[0]?.url}
        schema={structuredData}
      />

      <header className="page-header">
        <div className="container">
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/shop">Shop</Link>
            </li>
            <li>
              {categorySlug ? (
                <Link to={`/shop?category=${encodeURIComponent(categorySlug)}`}>{categoryName}</Link>
              ) : (
                <span>{categoryName}</span>
              )}
            </li>
            <li className="active" aria-current="page">
              {product.name}
            </li>
          </ol>
        </div>
      </header>

      <main className="section product-detail-page" id="main-content">
        <div className="container product-detail-grid">
          <div className="product-detail-gallery-col">
            <ImageGallery
              images={images}
              productName={product.name}
              showSaleBadge={Boolean(hasSale)}
            />
          </div>

          <div className="product-detail-info">
            {categorySlug ? (
              <Link
                className="product-detail-category-link"
                to={`/shop?category=${encodeURIComponent(categorySlug)}`}
              >
                {categoryName}
              </Link>
            ) : (
              <p className="product-detail-category-link product-detail-category-link--text">{categoryName}</p>
            )}

            <h1 className="product-detail-title">{product.name}</h1>

            <div className="product-detail-rating-row">
              <StarRating value={ratingValue} className="product-detail-stars" showValue />
              <button type="button" className="product-detail-reviews-link" onClick={scrollToReviews}>
                ({reviewCount} review{reviewCount === 1 ? '' : 's'})
              </button>
            </div>

            <p className={`product-detail-stock-badge ${product.inStock ? 'in' : 'out'}`}>
              {product.inStock ? 'In stock' : 'Out of stock'}
            </p>

            {!product.inStock ? (
              <form className="product-detail-notify" onSubmit={handleNotifyStock}>
                <label className="form-label" htmlFor="notify-email">
                  Get notified when back in stock
                </label>
                <div className="product-detail-notify__row">
                  <input
                    id="notify-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="form-control product-detail-notify__input"
                    placeholder="you@example.com"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    disabled={notifySubmitting}
                  />
                  <button type="submit" className="btn btn-outline product-detail-notify__btn" disabled={notifySubmitting}>
                    {notifySubmitting ? 'Saving…' : 'Notify me'}
                  </button>
                </div>
                {notifyBanner ? (
                  <p className="product-detail-notify__feedback" role="status">
                    {notifyBanner}
                  </p>
                ) : null}
              </form>
            ) : null}

            <div className="product-detail-price-block">
              <span className="price-current product-detail-price-current">{formatPKR(price)}</span>
              {hasSale ? (
                <>
                  <span className="price-original">{formatPKR(Number(compareAt))}</span>
                  {discountPct != null ? (
                    <span className="product-detail-discount-pill">−{discountPct}%</span>
                  ) : null}
                </>
              ) : null}
            </div>

            {product.shortDescription ? (
              <p className="product-detail-short">{product.shortDescription}</p>
            ) : null}

            {(product.color || product.texture || product.size) && (
              <ul className="product-detail-attrs" aria-label="Product details">
                {product.color ? (
                  <li>
                    <span className="product-detail-attrs__k">Color</span> {product.color}
                  </li>
                ) : null}
                {product.texture ? (
                  <li>
                    <span className="product-detail-attrs__k">Texture</span> {product.texture}
                  </li>
                ) : null}
                {product.size ? (
                  <li>
                    <span className="product-detail-attrs__k">Size</span> {product.size}
                  </li>
                ) : null}
              </ul>
            )}

            <div className="product-detail-qty">
              <span className="form-label">Quantity</span>
              <div className="qty-control qty-control--detail">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={!product.inStock}
                >
                  −
                </button>
                <span className="qty-display">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.min(stockMax || 1, q + 1))}
                  disabled={!product.inStock || qty >= (stockMax || 1)}
                >
                  +
                </button>
              </div>
              {product.inStock && Number.isFinite(stockMax) ? (
                <span className="stock-hint">{stockMax} available</span>
              ) : null}
            </div>

            <div className="product-detail-cta-block">
              <button
                type="button"
                className="btn btn-add-cart-detail"
                disabled={!product.inStock || adding}
                onClick={handleAdd}
              >
                {adding ? (
                  <span className="btn-add-cart-detail__inner">
                    <span className="btn-spinner btn-spinner--light" aria-hidden />
                    Adding…
                  </span>
                ) : (
                  'ADD TO CART'
                )}
              </button>
              <button type="button" className="product-detail-wishlist-btn" onClick={handleWishlist}>
                {inWishlist ? '♥ Saved to wishlist' : '♡ Add to Wishlist'}
              </button>
            </div>

            <div className="product-detail-share">
              <span className="product-detail-share__label">Share</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={whatsappShare}>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <div className="container product-detail-tabs-wrap">
          <div className="product-detail-tabs" role="tablist" aria-label="Product information">
            {['description', 'specs', 'reviews'].map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                className={`product-detail-tab ${activeTab === id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(id)}
                id={`tab-${id}`}
                aria-controls={`panel-${id}`}
              >
                {id === 'description' && 'Description'}
                {id === 'specs' && 'Specifications'}
                {id === 'reviews' && 'Reviews'}
              </button>
            ))}
          </div>

          <div
            id="panel-description"
            role="tabpanel"
            aria-labelledby="tab-description"
            hidden={activeTab !== 'description'}
            className="product-detail-panel"
          >
            {activeTab === 'description' && product.description ? (
              <div
                className="product-detail-html rte-content"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : activeTab === 'description' ? (
              <p className="empty-products-hint empty-products-hint--muted">No description provided.</p>
            ) : null}
          </div>

          <div
            id="panel-specs"
            role="tabpanel"
            aria-labelledby="tab-specs"
            hidden={activeTab !== 'specs'}
            className="product-detail-panel"
          >
            {activeTab === 'specs' ? (
              <dl className="product-spec-dl">
                <div>
                  <dt>SKU</dt>
                  <dd>{product.sku || '—'}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{categoryName}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>
                    {product.inStock
                      ? product.stockQuantity != null &&
                        Number.isFinite(Number(product.stockQuantity))
                        ? `In stock (${Math.floor(Number(product.stockQuantity))} units)`
                        : 'In stock'
                      : 'Out of stock'}
                  </dd>
                </div>
                {Array.isArray(product.tags) && product.tags.length > 0 ? (
                  <div>
                    <dt>Tags</dt>
                    <dd>{product.tags.join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>

          <div
            id="panel-reviews"
            role="tabpanel"
            aria-labelledby="tab-reviews"
            hidden={activeTab !== 'reviews'}
            className="product-detail-panel product-detail-panel--reviews"
          >
            <div id="product-reviews" className="product-reviews">
              {activeTab === 'reviews' ? (
                <>
                <h2 className="visually-hidden">Reviews</h2>

                {reviewTotal > 0 ? (
                  <div className="rating-breakdown">
                    <div className="rating-breakdown__avg">
                      <span className="rating-breakdown__score">{Number(product.rating).toFixed(1)}</span>
                      <StarRating value={ratingValue} className="rating-breakdown__stars" />
                      <span className="rating-breakdown__total">{reviewTotal} ratings</span>
                    </div>
                    <ul className="rating-breakdown__bars">
                      {histogram.map((row) => {
                        const c = Number(row.count) || 0;
                        const pct = reviewTotal > 0 ? Math.round((c / reviewTotal) * 100) : 0;
                        return (
                          <li key={row.stars} className="rating-breakdown__row">
                            <span className="rating-breakdown__label">{row.stars}★</span>
                            <span className="rating-breakdown__track">
                              <span className="rating-breakdown__fill" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="rating-breakdown__count">{c}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className="empty-products-hint empty-products-hint--muted">No reviews yet.</p>
                )}

                {Array.isArray(fake.reviews) && fake.reviews.length > 0 ? (
                  <ul className="review-list review-list--detail">
                    {fake.reviews.map((rev) => {
                      const rv = Number(rev.rating) || 0;
                      return (
                        <li key={rev.id} className="review-item">
                          <div className="review-item__head">
                            <strong>{rev.name}</strong>
                            {rev.isVerifiedPurchase ? (
                              <span className="review-item__verified">Verified purchase</span>
                            ) : null}
                          </div>
                          <StarRating value={rv} className="review-item__stars" />
                          {rev.location ? <p className="review-item__meta">{rev.location}</p> : null}
                          {rev.comment ? <p className="review-item__body">{rev.comment}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}

                <div className="product-review-form-wrap">
                  {user && product.reviewEligible ? (
                    <form className="product-review-form" onSubmit={handleSubmitReview}>
                      <h3 className="product-review-form__title">Write a review</h3>
                      <label className="form-label" htmlFor="review-rating">
                        Rating
                      </label>
                      <select
                        id="review-rating"
                        className="form-control product-review-form__rating"
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} stars
                          </option>
                        ))}
                      </select>
                      <label className="form-label" htmlFor="review-comment">
                        Comment
                      </label>
                      <textarea
                        id="review-comment"
                        className="form-control"
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        maxLength={2000}
                        placeholder="Share your experience with this product"
                      />
                      <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                        {reviewSubmitting ? 'Submitting…' : 'Submit review'}
                      </button>
                    </form>
                  ) : user && product.userHasReview ? (
                    <p className="product-review-note">You have already reviewed this product.</p>
                  ) : user && !product.reviewEligible ? (
                    <p className="product-review-note">
                      Reviews can be submitted only by customers who bought this item and received a delivered order.
                    </p>
                  ) : (
                    <p className="product-review-note">
                      <Link to="/login">Sign in</Link> to see if you can leave a review.
                    </p>
                  )}
                </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {Array.isArray(product.relatedProducts) && product.relatedProducts.length > 0 ? (
          <section className="section related-products" aria-label="Related products">
            <div className="container">
              <h2 className="related-products__title">You may also like</h2>
              <div className="related-strip">
                {product.relatedProducts.map((p) => {
                  const img = productImageUrl(p);
                  const pr = Number(p.price) || 0;
                  const ps = p.slug || p.productId;
                  return (
                    <Link key={p._id} to={`/shop/${encodeURIComponent(ps || '')}`} className="related-card">
                      <div className="related-card__img-wrap">
                        {img ? (
                          <ProductImage
                            src={img}
                            alt=""
                            className="related-card__img"
                            width={400}
                            height={400}
                          />
                        ) : (
                          <span className="related-card__emoji" aria-hidden>
                            {p.emoji || '📦'}
                          </span>
                        )}
                      </div>
                      <span className="related-card__name">{p.name}</span>
                      <span className="related-card__price">{formatPKR(pr)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <div className="container">
          <RecommendationRow title="Customers also bought" products={alsoBought} />
          <RecommendationRow title="Similar items" products={similar} />
        </div>
      </main>
    </>
  );
}
