import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { getCanonicalUrl, buildBreadcrumbListSchema } from '../utils/seo';
import { buildMetaDescription, buildMetaKeywords, buildPageTitle } from '../utils/pageSeo';
import { buildCategoryPath, buildProductPath, getProductCategorySlug } from '../utils/urls';
import { buildProductImageAlt } from '../utils/imageAlt';
import { getProductDetailLinks } from '../data/seoInternalLinks';
import InternalLinksBlock from '../components/InternalLinksBlock';
import {
  buildProductSchema,
  buildSpeakableSpecificationSchema,
  getProductPageReviews,
  getProductRatingForSchema
} from '../utils/jsonLd';
import { productImageUrl } from '../lib/productImage';
import { apiMessage } from '../lib/api';
import { formatPKR } from '../utils/currency';
import { trackViewContent } from '../lib/metaPixel';
import ImageGallery from '../components/ImageGallery';
import NotFound from './NotFound';
import ProductImage from '../components/ProductImage';
import RecommendationRow from '../components/RecommendationRow';
import ProductDetailPageSkeleton from '../components/skeletons/ProductDetailPageSkeleton';
import { consumePrerenderProductSeed, hidePrerenderFallback } from '../lib/prerenderFallback';
import { getPrefetchedProductResponse } from '../lib/prefetchProduct';
import { eventsAPI } from '../api/events';
import { recommendationsAPI, productsAPI } from '../api/storefront';
import api from '../api/client';
import { getSessionId } from '../lib/sessionId';
import StarRating from '../components/StarRating';
import { buildFakeReviews } from '../lib/fakeReviews';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { getProductPhysicalSpecs } from '../lib/productPhysicalSpecs';
import {
  getCleanShortDescription,
  getCleanLongDescription,
  resolveProductDescriptionHtml,
  sanitizeProductDescriptions
} from '../lib/productDescription';
import {
  axisHasOptionPrice,
  buildDefaultVariantPick,
  getOptionDisplayPrice,
  hasPerOptionPrice,
  isVariantOptionAvailable,
  resolveEffectiveComparePrice,
  resolveEffectivePrice,
  resolveEffectiveStock
} from '../lib/variantStock';
import './ProductDetailStickyBar.css';

function stripHtml(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = String(html);
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

const VARIANT_AXIS_LABELS = {
  color: 'Color',
  shape: 'Shape / material',
  size: 'Size'
};

function hasStructuredVariantAxes(va) {
  if (!va || typeof va !== 'object') return false;
  return ['color', 'shape', 'size'].some(
    (k) =>
      va[k]?.enabled &&
      Array.isArray(va[k].options) &&
      va[k].options.some((o) => String(o?.label || '').trim())
  );
}

function trimVariantOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.filter((o) => String(o?.label || '').trim());
}

/** Match product image URL to variant swatch URL (ignore query/hash). */
function urlsMatchImage(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  if (a === b) return true;
  const strip = (u) => u.split('?')[0].split('#')[0].trim();
  if (strip(a) === strip(b)) return true;
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin && ua.pathname === ub.pathname;
  } catch {
    return false;
  }
}

/** Human-readable variant line for cart / toast (storefront always single-select per axis). */
function buildVariantSelectionSummary(variantAxes, pick) {
  if (!variantAxes || !pick || typeof pick !== 'object') return '';
  const parts = [];
  for (const key of ['color', 'shape', 'size']) {
    const ax = variantAxes[key];
    if (!ax?.enabled) continue;
    const opts = trimVariantOptions(ax.options);
    if (!opts.length) continue;
    const sel = pick[key];
    const idx = Array.isArray(sel) && sel.length ? Number(sel[0]) : 0;
    const safeIdx = Number.isFinite(idx) && idx >= 0 && idx < opts.length ? idx : 0;
    const lab = opts[safeIdx]?.label;
    if (lab && String(lab).trim()) parts.push(`${VARIANT_AXIS_LABELS[key]}: ${String(lab).trim()}`);
  }
  return parts.join(' · ');
}

function formatCategoryLabel(slug, name) {
  if (name && String(name).trim()) return String(name).trim();
  if (!slug) return 'Shop';
  return String(slug)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readCachedProduct(slug) {
  const res = getPrefetchedProductResponse(slug);
  const data = res?.data?.data;
  if (!data) return null;
  return sanitizeProductDescriptions(data);
}

function readInitialProduct(slug) {
  const cached = readCachedProduct(slug);
  if (cached) return cached;
  const seed = consumePrerenderProductSeed();
  if (seed && (!slug || !seed.slug || seed.slug === slug)) {
    return sanitizeProductDescriptions(seed);
  }
  return null;
}

export default function ProductDetail() {
  const { slug: legacySlug, categorySlug: routeCategorySlug, productSlug } = useParams();
  const slug = productSlug || legacySlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccessCustomerApp } = useAuth();
  const customerUser = canAccessCustomerApp ? user : null;
  const { addToCart } = useCart();
  const { toggleWishlist, products: wishProducts } = useWishlist();
  const initialCached = readInitialProduct(slug);
  const [product, setProduct] = useState(initialCached);
  const [loading, setLoading] = useState(!initialCached);
  const [notFound, setNotFound] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyBanner, setNotifyBanner] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alsoBought, setAlsoBought] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [variantGalleryExtraUrl, setVariantGalleryExtraUrl] = useState(null);
  const [variantPick, setVariantPick] = useState({});
  const loadSeqRef = useRef(0);

  // Must be declared before any early returns (hooks order).
  const fake = useMemo(() => buildFakeReviews(product), [product]);
  const { settings: storeSettings } = useStoreSettings({ pollMs: 0 });

  const loadProduct = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    const cached = readCachedProduct(slug);

    if (cached) {
      setProduct(cached);
      setLoading(false);
      setNotFound(false);
    } else {
      setProduct(null);
      setLoading(true);
      setNotFound(false);
    }

    try {
      const prefetched = getPrefetchedProductResponse(slug);
      const res = prefetched ?? (await productsAPI.getOne(slug));
      if (seq !== loadSeqRef.current) return;

      const data = res.data?.data;
      if (data?.unavailable) {
        setProduct(sanitizeProductDescriptions(data));
        return;
      }
      if (data) {
        setProduct(sanitizeProductDescriptions(data));
        return;
      }
      setProduct(null);
      setNotFound(true);
    } catch (e) {
      if (seq !== loadSeqRef.current) return;
      setProduct(null);
      if (e.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(apiMessage(e, 'Could not load product'));
        setNotFound(true);
      }
    } finally {
      if (seq === loadSeqRef.current) {
        setLoading(false);
      }
    }
  }, [slug]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    if (!loading && (product || notFound)) {
      hidePrerenderFallback();
    }
  }, [loading, product, notFound]);

  /** Redirect legacy /shop/:slug → canonical /:category/:slug */
  useEffect(() => {
    if (!product?.slug || product.unavailable) return;
    const canonical = buildProductPath(product.slug, getProductCategorySlug(product));
    const current = location.pathname.replace(/\/+$/, '') || '/';
    const target = canonical.replace(/\/+$/, '');
    if (current !== target) {
      navigate(`${target}${location.search}${location.hash}`, { replace: true });
    }
  }, [product, location.pathname, location.search, location.hash, navigate]);

  useEffect(() => {
    if (!product?._id || product?.unavailable) return;
    trackViewContent(product, customerUser);
  }, [product?._id, product?.unavailable, product?.name, product?.price, customerUser]);

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
  }, [product]);

  useEffect(() => {
    setQty(1);
  }, [slug, product?._id]);

  useEffect(() => {
    setNotifyEmail('');
    setNotifyBanner(null);
    setTermsAccepted(false);
  }, [slug]);

  const handleNotifyStock = async (e) => {
    e.preventDefault();
    if (!slug || !notifyEmail.trim()) return;
    setNotifySubmitting(true);
    setNotifyBanner(null);
    try {
      const res = await api.post(`/api/products/${encodeURIComponent(slug)}/notify-stock`, {
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

  const getCartVariantNote = useCallback(() => {
    if (!product || !hasStructuredVariantAxes(product.variantAxes)) return '';
    return buildVariantSelectionSummary(product.variantAxes, variantPick);
  }, [product, variantPick]);

  const selectionStock = useMemo(() => {
    if (!product) return 0;
    return resolveEffectiveStock(product, variantPick);
  }, [product, variantPick]);

  const selectionInStock = useMemo(() => selectionStock > 0, [selectionStock]);

  const selectionPrice = useMemo(() => {
    if (!product) return 0;
    return resolveEffectivePrice(product, variantPick);
  }, [product, variantPick]);

  const selectionComparePrice = useMemo(() => {
    if (!product) return null;
    return resolveEffectiveComparePrice(product, variantPick);
  }, [product, variantPick]);

  const handleAdd = async () => {
    if (!product) return;
    if (!selectionInStock) {
      toast.error('This option is out of stock');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, qty, {
        cartVariantNote: getCartVariantNote(),
        effectiveStock: selectionStock,
        effectivePrice: selectionPrice
      });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions to continue');
      return;
    }
    if (!selectionInStock) return;

    setBuyingNow(true);
    try {
      const result = await addToCart(product, qty, {
        cartVariantNote: getCartVariantNote(),
        effectiveStock: selectionStock,
        effectivePrice: selectionPrice,
        silent: true
      });
      if (result?.success) {
        navigate('/checkout');
      }
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };

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

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Product',
          text: product?.name || '',
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    copyLink();
  };

  useEffect(() => {
    if (loading || notFound || !product) {
      document.body.classList.remove('product-detail-sticky-visible');
      return undefined;
    }

    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => {
      if (mq.matches) document.body.classList.add('product-detail-sticky-visible');
      else document.body.classList.remove('product-detail-sticky-visible');
    };

    apply();
    mq.addEventListener('change', apply);

    return () => {
      mq.removeEventListener('change', apply);
      document.body.classList.remove('product-detail-sticky-visible');
    };
  }, [loading, notFound, product]);

  const scrollToReviews = () => {
    setActiveTab('reviews');
    window.setTimeout(() => {
      document.getElementById('panel-reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const price = selectionPrice;
  const hasSale =
    product &&
    selectionComparePrice != null &&
    Number(selectionComparePrice) > price &&
    Number(selectionComparePrice) > 0;
  const discountPct =
    hasSale && Number(selectionComparePrice) > 0
      ? Math.round(((Number(selectionComparePrice) - price) / Number(selectionComparePrice)) * 100)
      : null;

  const images = useMemo(() => {
    if (!product) return [];
    if (product.images?.length > 0) return product.images;
    const u = productImageUrl(product);
    return u ? [{ url: u }] : [];
  }, [product]);

  const galleryImagesForUi = useMemo(() => {
    const base = images;
    if (!variantGalleryExtraUrl) return base;
    if (base.some((im) => urlsMatchImage(im.url, variantGalleryExtraUrl))) return base;
    return [{ url: variantGalleryExtraUrl }, ...base];
  }, [images, variantGalleryExtraUrl]);

  useEffect(() => {
    setGalleryIndex((i) => Math.min(Math.max(0, i), Math.max(0, galleryImagesForUi.length - 1)));
  }, [galleryImagesForUi]);

  useEffect(() => {
    setGalleryIndex(0);
    setVariantGalleryExtraUrl(null);
    setVariantPick({});
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    if (product.unavailable || !hasStructuredVariantAxes(product.variantAxes)) {
      setVariantPick({});
      setVariantGalleryExtraUrl(null);
      setGalleryIndex(0);
      return;
    }
    const baseImgs =
      Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (() => {
            const u = productImageUrl(product);
            return u ? [{ url: u }] : [];
          })();

    const next = buildDefaultVariantPick(product.variantAxes, trimVariantOptions);
    setVariantPick(next);
    setVariantGalleryExtraUrl(null);
    setGalleryIndex(0);

    const firstAxisWithImage = ['color', 'shape', 'size'].find((key) => {
      const ax = product.variantAxes[key];
      if (!ax?.enabled) return false;
      const opts = trimVariantOptions(ax.options);
      const pickIdx = next[key]?.[0] ?? 0;
      return opts[pickIdx]?.image?.url;
    });

    if (firstAxisWithImage) {
      const ax = product.variantAxes[firstAxisWithImage];
      const opts = trimVariantOptions(ax.options);
      const pickIdx = next[firstAxisWithImage]?.[0] ?? 0;
      const u = opts[pickIdx]?.image?.url;
      if (u) {
        const idx = baseImgs.findIndex((im) => urlsMatchImage(im.url, u));
        if (idx >= 0) {
          setGalleryIndex(idx);
          return;
        }
        setVariantGalleryExtraUrl(u);
        setGalleryIndex(0);
      }
    }
  }, [product]);

  const handleVariantOptionClick = useCallback(
    (axisKey, flatOptionIndex) => {
      if (!product || !hasStructuredVariantAxes(product.variantAxes)) return;
      const ax = product.variantAxes[axisKey];
      if (!ax?.enabled) return;
      const opts = trimVariantOptions(ax.options);
      const opt = opts[flatOptionIndex];
      if (!opt) return;

      const baseStock =
        product.stockQuantity != null && product.stockQuantity !== ''
          ? Math.max(0, Math.floor(Number(product.stockQuantity)))
          : 0;
      const available = isVariantOptionAvailable(
        product.variantAxes,
        variantPick,
        axisKey,
        flatOptionIndex,
        baseStock
      );
      if (!available) {
        toast.error('This option is out of stock');
        return;
      }

      setVariantPick((p) => ({ ...p, [axisKey]: [flatOptionIndex] }));

      const imageUrl = opt.image?.url;
      if (!imageUrl) return;

      const idx = images.findIndex((im) => urlsMatchImage(im.url, imageUrl));
      if (idx >= 0) {
        setVariantGalleryExtraUrl(null);
        setGalleryIndex(idx);
      } else {
        setVariantGalleryExtraUrl(imageUrl);
        setGalleryIndex(0);
      }
    },
    [product, images, variantPick]
  );

  const stockMax = useMemo(() => {
    if (!product) return 1;
    if (selectionStock > 0) return selectionStock;
    return 0;
  }, [product, selectionStock]);

  useEffect(() => {
    setQty((q) => {
      if (stockMax <= 0) return 1;
      return Math.min(Math.max(1, q), stockMax);
    });
  }, [stockMax, variantPick]);

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

  const productPath = useMemo(() => {
    if (!slug) return '/shop';
    const cat = product
      ? getProductCategorySlug(product)
      : routeCategorySlug || '';
    return buildProductPath(slug, cat);
  }, [slug, product, routeCategorySlug]);
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${productPath}`;
  }, [productPath]);
  const canonicalUrl = useMemo(() => getCanonicalUrl(productPath), [productPath]);

  const productJsonLd = useMemo(() => {
    if (!product) return null;
    const imgs = images.map((i) => i && i.url).filter(Boolean);
    const short = getCleanShortDescription(product);
    const long = getCleanLongDescription(product);
    const desc = (short || long || String(product.name || '')).trim().slice(0, 8000);
    const inStock = selectionInStock;
    const { ratingValue, reviewCount } = getProductRatingForSchema(product, fake);
    const pageReviews = getProductPageReviews(product, fake);
    return buildProductSchema(product, {
      canonicalUrl,
      images: imgs,
      price,
      inStock,
      ratingValue,
      reviewCount,
      description: desc,
      reviews: pageReviews,
      storeSettings
    });
  }, [product, images, price, canonicalUrl, fake, storeSettings, selectionInStock, selectionPrice]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!product || product.unavailable) return null;
    const catSlug = product.categorySlug || product.category;
    const catName = formatCategoryLabel(catSlug, product.categoryName);
    const pathCat =
      catSlug && String(catSlug)
        ? buildCategoryPath(String(catSlug))
        : null;
    const list = [{ name: 'Home', path: '/' }];
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
    const schemas = [breadcrumbJsonLd, productJsonLd];

    const speakable = buildSpeakableSpecificationSchema(canonicalUrl, [
      '.product-detail-title',
      '.product-detail-short'
    ]);
    if (speakable) schemas.push(speakable);

    return schemas;
  }, [productJsonLd, breadcrumbJsonLd, canonicalUrl]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!product?.reviewEligible || !product._id) return;
    setReviewSubmitting(true);
    try {
      await productsAPI.addReview(product._id, { rating: reviewRating, comment: reviewComment.trim() });
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

  if (loading && !product) {
    return (
      <>
        <SEO title="Product" description="Loading product details at Bazaar." />
        <ProductDetailPageSkeleton />
      </>
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
      getCleanShortDescription(product).slice(0, 160) ||
      getCleanLongDescription(product).slice(0, 160) ||
      `${product.name} is not available at Bazaar.`;

    return (
      <>
        <SEO
          noIndex
          title={`${product.name} — Unavailable`}
          description={metaUnavailable}
          canonicalUrl={productPath}
        />
        <header className="page-header page-header--product-detail">
          <div className="container">
            <ol className="breadcrumb" aria-label="Breadcrumb">
              <li>
                <Link to="/">Home</Link>
              </li>
              {catSlugUn ? (
                <li>
                  <Link to={buildCategoryPath(catSlugUn)}>{catNameUn}</Link>
                </li>
              ) : (
                <li>
                  <Link to="/shop">Shop</Link>
                </li>
              )}
              <li className="active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </div>
        </header>

        <div className="section product-detail-page">
          <div className="container product-detail-unavailable">
            <div className="product-detail-grid">
              <div className="product-detail-gallery-col">
                <ImageGallery
                  images={galleryImagesForUi}
                  productName={product.name}
                  showSaleBadge={Boolean(hasSale)}
                  discountPercent={discountPct ?? undefined}
                  activeIndex={galleryIndex}
                  onActiveIndexChange={setGalleryIndex}
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
                      to={buildCategoryPath(catSlugUn)}
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
                        <Link
                          key={p._id}
                          to={buildProductPath(ps || '', getProductCategorySlug(p))}
                          className="related-card"
                        >
                          <div className="related-card__img-wrap">
                            {img ? (
                              <ProductImage
                                src={img}
                                alt={buildProductImageAlt(p)}
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
        </div>

        <div className="product-detail-sticky-bar" role="toolbar" aria-label="Product actions">
          <Link to="/shop" className="product-detail-sticky-bar__buy product-detail-sticky-bar__link">
            Browse Shop
          </Link>
          <button
            type="button"
            className="product-detail-sticky-bar__share"
            onClick={handleShare}
            aria-label="Share product"
          >
            <Share2 size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </>
    );
  }

  const categorySlug = product.categorySlug || product.category;
  const categoryName = formatCategoryLabel(categorySlug, product.categoryName);
  const physicalSpecs = getProductPhysicalSpecs(product);
  const shortDescriptionClean = getCleanShortDescription(product);
  const descriptionHtmlClean = resolveProductDescriptionHtml(product);
  const reviewCount = fake.count;
  const ratingValue = fake.rating;

  const metaDesc = buildMetaDescription(
    product.name,
    selectionInStock ? 'Buy now with secure checkout and fast delivery.' : 'View details and get notified when back in stock.',
    shortDescriptionClean.slice(0, 120) || getCleanLongDescription(product).slice(0, 120)
  );

  const productInternalLinks = getProductDetailLinks({
    categorySlug,
    categoryName
  });

  return (
    <>
      <SEO
        title={buildPageTitle(product.name, categoryName)}
        description={metaDesc}
        canonicalUrl={productPath}
        ogType="product"
        ogImage={images[0]?.url}
        ogImageAlt={product.name}
        keywords={buildMetaKeywords(product.name, categoryName, 'buy online Pakistan', 'Bazaar')}
        schema={structuredData}
      />

      <header className="page-header page-header--product-detail">
        <div className="container">
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            {categorySlug ? (
              <li>
                <Link to={buildCategoryPath(categorySlug)}>{categoryName}</Link>
              </li>
            ) : (
              <li>
                <Link to="/shop">Shop</Link>
              </li>
            )}
            <li className="active" aria-current="page">
              {product.name}
            </li>
          </ol>
        </div>
      </header>

      <div className="section product-detail-page">
        <div className="container product-detail-grid">
          <div className="product-detail-gallery-col">
            <ImageGallery
              images={galleryImagesForUi}
              productName={product.name}
              showSaleBadge={Boolean(hasSale)}
              discountPercent={discountPct ?? undefined}
              activeIndex={galleryIndex}
              onActiveIndexChange={setGalleryIndex}
            />
          </div>

          <div className="product-detail-info">
            {categorySlug ? (
              <Link
                className="product-detail-category-link"
                to={buildCategoryPath(categorySlug)}
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

            <p className={`product-detail-stock-badge ${selectionInStock ? 'in' : 'out'}`}>
              {selectionInStock
                ? stockMax > 0 && stockMax <= 5
                  ? `Only ${stockMax} left in stock`
                  : 'In stock'
                : 'Out of stock'}
            </p>

            {!selectionInStock ? (
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
              {hasPerOptionPrice(product.variantAxes) ? (
                <p className="product-detail-price-note">Price for your selected option</p>
              ) : null}
              <span className="price-current product-detail-price-current">{formatPKR(price)}</span>
              {hasSale ? (
                <>
                  <span className="price-original">{formatPKR(Number(selectionComparePrice))}</span>
                  {discountPct != null ? (
                    <span className="product-detail-discount-pill">−{discountPct}%</span>
                  ) : null}
                </>
              ) : null}
            </div>

            {shortDescriptionClean ? (
              <p className="product-detail-short">{shortDescriptionClean}</p>
            ) : null}

            {hasStructuredVariantAxes(product.variantAxes) ? (
              <div className="product-detail-variants" aria-label="Product variants">
                {['color', 'shape', 'size'].map((key) => {
                  const ax = product.variantAxes[key];
                  if (!ax?.enabled || !ax.options?.length) return null;
                  const opts = ax.options.filter((o) => String(o.label || '').trim());
                  if (!opts.length) return null;
                  const showPricesOnAxis = axisHasOptionPrice(ax);
                  return (
                    <div key={key} className="product-detail-variant-block">
                      <div className="product-detail-variant-head">
                        <span className="product-detail-attrs__k">{VARIANT_AXIS_LABELS[key]}</span>
                        <span className="product-detail-variant-mode">Choose one</span>
                      </div>
                      <ul className="product-detail-variant-list">
                        {opts.map((o, i) => {
                          const sel = variantPick[key];
                          const cur = Array.isArray(sel) && sel.length ? sel : [0];
                          const isSelected = cur.includes(i);
                          const baseStock =
                            product.stockQuantity != null && product.stockQuantity !== ''
                              ? Math.max(0, Math.floor(Number(product.stockQuantity)))
                              : 0;
                          const optionAvailable = isVariantOptionAvailable(
                            product.variantAxes,
                            variantPick,
                            key,
                            i,
                            baseStock
                          );
                          const optionStock = resolveEffectiveStock(product, {
                            ...variantPick,
                            [key]: [i]
                          });
                          const optionPrice = showPricesOnAxis
                            ? getOptionDisplayPrice(product.variantAxes, variantPick, key, i, product)
                            : null;
                          const optionCompare = showPricesOnAxis
                            ? (() => {
                                const testPick = { ...variantPick, [key]: [i] };
                                return resolveEffectiveComparePrice(product, testPick);
                              })()
                            : null;
                          const optionOnSale =
                            optionCompare != null &&
                            Number(optionCompare) > (optionPrice ?? 0) &&
                            Number(optionCompare) > 0;
                          return (
                            <li key={`${key}-${i}-${o.label}`} role="none">
                              <button
                                type="button"
                                className={`product-detail-variant-chip${isSelected ? ' is-selected' : ''}${!optionAvailable ? ' is-out-of-stock' : ''}${showPricesOnAxis ? ' has-price' : ''}`}
                                aria-pressed={isSelected}
                                aria-disabled={!optionAvailable}
                                disabled={!optionAvailable}
                                aria-label={`${VARIANT_AXIS_LABELS[key]}: ${o.label}${optionPrice != null ? `, ${formatPKR(optionPrice)}` : ''}${!optionAvailable ? ' (out of stock)' : optionStock > 0 ? ` (${optionStock} available)` : ''}`}
                                onClick={() => handleVariantOptionClick(key, i)}
                              >
                                {o.image?.url ? (
                                  <span className="product-detail-variant-swatch-wrap" aria-hidden>
                                    <img
                                      className="product-detail-variant-swatch"
                                      src={o.image.url}
                                      alt=""
                                      width={36}
                                      height={36}
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  </span>
                                ) : null}
                                <span className="product-detail-variant-chip-text">
                                  <span className="product-detail-variant-chip-label">{o.label}</span>
                                  {showPricesOnAxis && optionPrice != null ? (
                                    <span className="product-detail-variant-price">
                                      {formatPKR(optionPrice)}
                                      {optionOnSale ? (
                                        <span className="product-detail-variant-price-was">
                                          {formatPKR(Number(optionCompare))}
                                        </span>
                                      ) : null}
                                    </span>
                                  ) : null}
                                </span>
                                {!optionAvailable ? (
                                  <span className="product-detail-variant-oos">Sold out</span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (product.color || product.texture || physicalSpecs.size || physicalSpecs.weight) ? (
              <ul className="product-detail-attrs" aria-label="Product details">
                {physicalSpecs.size ? (
                  <li>
                    <span className="product-detail-attrs__k">Size</span> {physicalSpecs.size}
                  </li>
                ) : null}
                {physicalSpecs.weight ? (
                  <li>
                    <span className="product-detail-attrs__k">Weight</span> {physicalSpecs.weight}
                  </li>
                ) : null}
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
              </ul>
            ) : null}

            <div className="product-detail-qty">
              <span className="form-label">Quantity</span>
              <div className="qty-control qty-control--detail">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={!selectionInStock}
                >
                  −
                </button>
                <span className="qty-display">{qty}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQty((q) => Math.min(stockMax || 1, q + 1))}
                  disabled={!selectionInStock || qty >= (stockMax || 1)}
                >
                  +
                </button>
              </div>
              {selectionInStock && Number.isFinite(stockMax) && stockMax > 0 ? (
                <span className="stock-hint">{stockMax} available</span>
              ) : null}
            </div>

            <div className="product-detail-cta-block">
              <button
                type="button"
                className="btn btn-add-cart-detail"
                disabled={!selectionInStock || adding}
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

              <div className="product-detail-buy-now">
                <label className="product-detail-terms">
                  <input
                    type="checkbox"
                    className="product-detail-terms__input"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={!selectionInStock}
                  />
                  <span className="product-detail-terms__text">
                    I agree to the{' '}
                    <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                      Terms &amp; Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-buy-now-detail"
                  disabled={!selectionInStock || buyingNow || !termsAccepted}
                  aria-disabled={!selectionInStock || buyingNow || !termsAccepted}
                  onClick={handleBuyNow}
                >
                  {buyingNow ? (
                    <span className="btn-buy-now-detail__inner">
                      <span className="btn-spinner btn-spinner--on-gold" aria-hidden />
                      Processing…
                    </span>
                  ) : (
                    'BUY NOW'
                  )}
                </button>
              </div>

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
            {activeTab === 'description' && descriptionHtmlClean ? (
              <div
                className="product-detail-html product-description-html"
                dangerouslySetInnerHTML={{ __html: descriptionHtmlClean }}
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
                    {selectionInStock
                      ? stockMax > 0
                        ? `In stock (${stockMax} units)`
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
                  {customerUser && product.reviewEligible ? (
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
                  ) : customerUser && product.userHasReview ? (
                    <p className="product-review-note">You have already reviewed this product.</p>
                  ) : customerUser && !product.reviewEligible ? (
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
                    <Link
                      key={p._id}
                      to={buildProductPath(ps || '', getProductCategorySlug(p))}
                      className="related-card"
                    >
                      <div className="related-card__img-wrap">
                        {img ? (
                          <ProductImage
                            src={img}
                            alt={buildProductImageAlt(p)}
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
          <InternalLinksBlock
            className="product-detail-internal-links"
            title="Shop related categories"
            links={productInternalLinks}
          />
          <RecommendationRow title="Customers also bought" products={alsoBought} />
          <RecommendationRow title="Similar items" products={similar} />
        </div>
      </div>

      {product ? (
        <div className="product-detail-sticky-bar" role="toolbar" aria-label="Quick purchase">
          <button
            type="button"
            className="product-detail-sticky-bar__cart"
            disabled={!selectionInStock || adding}
            onClick={handleAdd}
          >
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>
          <button
            type="button"
            className="product-detail-sticky-bar__buy"
            disabled={!selectionInStock || buyingNow}
            onClick={() => {
              if (!termsAccepted) {
                toast.error('Please accept Terms & Conditions first');
                document.querySelector('.product-detail-terms')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
                return;
              }
              handleBuyNow();
            }}
          >
            {buyingNow ? 'Processing…' : 'Buy Now'}
          </button>
          <button
            type="button"
            className="product-detail-sticky-bar__share"
            onClick={handleShare}
            aria-label="Share product"
          >
            <Share2 size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </>
  );
}
