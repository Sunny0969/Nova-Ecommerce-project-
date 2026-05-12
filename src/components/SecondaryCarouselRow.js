import React, { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * SecondaryCarouselRow
 * - Horizontal scroll on all devices.
 * - Desktop: arrow buttons to move the scroll container.
 */
export default function SecondaryCarouselRow({ title, children, onPrev, onNext }) {
  const scrollerRef = useRef(null);

  const scrollByCard = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(260, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const handlePrev = () => {
    scrollByCard(-1);
    onPrev?.();
  };

  const handleNext = () => {
    scrollByCard(1);
    onNext?.();
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Basic keyboard: arrow keys when focused.
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, []);

  const ariaTitleId = useMemo(() => `carousel-title-${Math.random().toString(16).slice(2)}`, []);

  return (
    <section className="section section--blog secondary" aria-labelledby={ariaTitleId}>
      <div className="container">
        <div className="section-header section-header-flex secondary__head">
          <div className="secondary__intro">
            <span className="section-tag section-tag--light">{title}</span>
          </div>
          <div className="secondary__arrows" aria-hidden="true">
            <button
              type="button"
              className="blog-carousel__arrow blog-carousel__arrow--prev"
              onClick={handlePrev}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="blog-carousel__arrow blog-carousel__arrow--next"
              onClick={handleNext}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          className="blog-carousel"
          role="region"
          aria-label={title}
          tabIndex={0}
          ref={scrollerRef}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

