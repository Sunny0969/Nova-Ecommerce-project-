import React, { useCallback, useEffect, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/**
 * @param {{ url: string }[]} props.images
 * @param {string} props.productName
 * @param {boolean} [props.showSaleBadge]
 */
export default function ImageGallery({ images, productName, showSaleBadge }) {
  const list = Array.isArray(images) && images.length ? images : [];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images]);

  const safeActive = Math.min(active, Math.max(0, list.length - 1));
  const mainUrl = list[safeActive]?.url || '';

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

  if (!mainUrl) {
    return (
      <div className="image-gallery image-gallery--empty" aria-hidden>
        <div className="image-gallery__main image-gallery__main--placeholder">📦</div>
      </div>
    );
  }

  const lbUrl = list[lbIndex]?.url || mainUrl;

  return (
    <div className="image-gallery">
      {showSaleBadge ? (
        <span className="image-gallery__sale-badge" aria-hidden>
          Sale
        </span>
      ) : null}
      <button
        type="button"
        className="image-gallery__main"
        onClick={() => openLightbox(safeActive)}
        aria-label={`View larger image ${safeActive + 1} of ${list.length}`}
      >
        <LazyLoadImage
          src={mainUrl}
          alt={productName}
          effect="blur"
          className="image-gallery__main-img"
          width={1200}
          height={1200}
          visibleByDefault={safeActive === 0}
          decoding="async"
        />
      </button>

      {list.length > 1 ? (
        <div className="image-gallery__thumbs" role="tablist" aria-label="Product images">
          {list.map((im, i) => (
            <button
              key={`${im.url}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === safeActive}
              className={`image-gallery__thumb ${i === safeActive ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <LazyLoadImage
                src={im.url}
                alt=""
                effect="opacity"
                className="image-gallery__thumb-img"
                width={112}
                height={112}
                decoding="async"
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
            <img
              className="image-gallery-lightbox__img"
              src={lbUrl}
              alt={productName}
              width={1400}
              height={1400}
              decoding="async"
              fetchPriority="high"
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
