import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { buildProductImageAlt } from '../utils/imageAlt';
import ProductSaleRibbon from './ProductSaleRibbon';

const GALLERY_MAIN_SIZE = 1200;
const GALLERY_THUMB_SIZE = 112;

/**
 * @param {{ url: string }[]} props.images
 * @param {string} props.productName
 * @param {boolean} [props.showSaleBadge]
 * @param {number} [props.discountPercent]
 * @param {number} [props.activeIndex] — controlled slide index (use with onActiveIndexChange)
 * @param {(index: number) => void} [props.onActiveIndexChange] — when set, gallery index is controlled by parent
 */
export default function ImageGallery({
  images,
  productName,
  showSaleBadge,
  discountPercent,
  activeIndex: activeIndexProp,
  onActiveIndexChange
}) {
  const raw = Array.isArray(images) && images.length ? images : [];
  const list = raw
    .map((im) => ({ ...im, url: String(im?.url || '').trim() }))
    .filter((im) => im.url);
  const controlled = typeof onActiveIndexChange === 'function';
  const [internalActive, setInternalActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const mainAlt = buildProductImageAlt({ name: productName });

  useEffect(() => {
    if (!controlled) setInternalActive(0);
  }, [images, controlled]);

  const active = controlled && typeof activeIndexProp === 'number' ? activeIndexProp : internalActive;
  const safeActive = Math.min(active, Math.max(0, list.length - 1));

  const commitActive = useCallback(
    (i) => {
      const n = Math.min(Math.max(0, i), Math.max(0, list.length - 1));
      if (controlled) onActiveIndexChange(n);
      else setInternalActive(n);
    },
    [controlled, onActiveIndexChange, list.length]
  );

  const openLightbox = useCallback(
    (index) => {
      setLbIndex(Math.min(Math.max(0, index), Math.max(0, list.length - 1)));
      setLightbox(true);
    },
    [list.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight' && list.length > 1) {
        setLbIndex((i) => (i + 1) % list.length);
      }
      if (e.key === 'ArrowLeft' && list.length > 1) {
        setLbIndex((i) => (i - 1 + list.length) % list.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, list.length]);

  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  if (!list.length) {
    return (
      <div className="image-gallery image-gallery--empty" aria-hidden>
        <div className="image-gallery__main image-gallery__main--placeholder">📦</div>
      </div>
    );
  }

  const mainUrl = list[safeActive]?.url || list[0]?.url;
  const lbUrl = list[lbIndex]?.url || mainUrl;

  return (
    <div className="image-gallery">
      {showSaleBadge ? (
        <ProductSaleRibbon
          discountPercent={discountPercent}
          className="image-gallery__sale-ribbon"
        />
      ) : null}
      <button
        type="button"
        className="image-gallery__main"
        onClick={() => openLightbox(safeActive)}
        aria-label={`View larger image ${safeActive + 1} of ${list.length}`}
      >
        <OptimizedImage
          key={mainUrl}
          src={mainUrl}
          alt={mainAlt}
          className="image-gallery__main-img"
          width={GALLERY_MAIN_SIZE}
          height={GALLERY_MAIN_SIZE}
          priority
          optimizeWidth={GALLERY_MAIN_SIZE}
        />
      </button>

      {list.length > 1 ? (
        <div className="image-gallery__thumbs" role="tablist" aria-label="Product images">
          {list.map((im, i) => (
            <button
              key={`gallery-thumb-${i}`}
              type="button"
              role="tab"
              aria-selected={i === safeActive}
              aria-label={`Product image ${i + 1} of ${list.length}`}
              className={`image-gallery__thumb ${i === safeActive ? 'is-active' : ''}`}
              onClick={() => commitActive(i)}
            >
              <OptimizedImage
                src={im.url}
                alt=""
                className="image-gallery__thumb-img"
                width={GALLERY_THUMB_SIZE}
                height={GALLERY_THUMB_SIZE}
                optimizeWidth={GALLERY_THUMB_SIZE}
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="image-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <button
            type="button"
            className="image-gallery-lightbox__backdrop"
            aria-label="Close gallery"
            onClick={() => setLightbox(false)}
          />
          <div className="image-gallery-lightbox__content">
            <button
              type="button"
              className="image-gallery-lightbox__close"
              onClick={() => setLightbox(false)}
              aria-label="Close"
            >
              <X size={28} strokeWidth={1.5} />
            </button>
            {list.length > 1 ? (
              <>
                <button
                  type="button"
                  className="image-gallery-lightbox__nav image-gallery-lightbox__nav--prev"
                  onClick={() => setLbIndex((i) => (i - 1 + list.length) % list.length)}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={36} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="image-gallery-lightbox__nav image-gallery-lightbox__nav--next"
                  onClick={() => setLbIndex((i) => (i + 1) % list.length)}
                  aria-label="Next image"
                >
                  <ChevronRight size={36} strokeWidth={1.5} />
                </button>
              </>
            ) : null}
            <OptimizedImage
              className="image-gallery-lightbox__img"
              src={lbUrl}
              alt={mainAlt}
              width={1400}
              height={1400}
              priority
              optimizeWidth={1400}
            />
            {list.length > 1 ? (
              <p className="image-gallery-lightbox__counter">
                {lbIndex + 1} / {list.length}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
