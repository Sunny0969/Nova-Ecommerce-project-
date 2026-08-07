import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  HOME_BANNER_INTERVAL_MS,
  HOME_BANNER_SLIDES,
  HOME_BANNER_WIDTH,
  HOME_BANNER_HEIGHT,
  HOME_BANNER_SRC_WIDTHS,
  HOME_BANNER_SIZES
} from '../config/homeBannerSlides';
import { buildCloudinaryImageUrl, buildCloudinarySrcSet } from '../utils/cloudinaryImage';
import { optimizeImageUrl } from '../utils/optimizedImageUrl';
import './HomeBannerSlider.css';

function BannerSlideImage({ slide, priority }) {
  const publicId = slide.cloudinaryPublicId;

  const { src, srcSet } = useMemo(() => {
    if (publicId) {
      return {
        src: buildCloudinaryImageUrl(publicId, { width: 600 }),
        srcSet: buildCloudinarySrcSet(publicId, HOME_BANNER_SRC_WIDTHS)
      };
    }
    return { src: optimizeImageUrl(slide.src, { width: 600, quality: 'auto' }), srcSet: undefined };
  }, [publicId, slide.src]);

  return (
    <img
      src={src}
      {...(srcSet ? { srcSet, sizes: HOME_BANNER_SIZES } : {})}
      alt={slide.alt || 'Promotional banner at Bazaar'}
      className="home-banner-slider__img"
      width={HOME_BANNER_WIDTH}
      height={HOME_BANNER_HEIGHT}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}

export default function HomeBannerSlider() {
  const slides = HOME_BANNER_SLIDES;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (index) => {
      if (!slides.length) return;
      setActive(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, HOME_BANNER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused]);

  const lcpPreloadHref = useMemo(() => {
    const first = slides[0];
    if (!first) return null;
    if (first.cloudinaryPublicId) {
      return buildCloudinaryImageUrl(first.cloudinaryPublicId, { width: 600 });
    }
    return first.src || null;
  }, [slides]);

  if (!slides.length) return null;

  return (
    <>
      {lcpPreloadHref ? (
        <Helmet>
          <link rel="preload" as="image" href={lcpPreloadHref} fetchpriority="high" />
        </Helmet>
      ) : null}
      <section
        className="home-banner-slider home-banner-slider-wrapper"
        aria-label="Promotional offers"
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="home-banner-slider__viewport">
          <div
            className="home-banner-slider__track"
            style={{ transform: `translateX(-${active * 100}%)` }}
            aria-live="polite"
          >
            {slides.map((slide, index) => (
              <div
                key={`${slide.cloudinaryPublicId || slide.src}-${index}`}
                className="home-banner-slider__slide"
                aria-hidden={index !== active}
              >
                <BannerSlideImage slide={slide} priority={index === 0} />
                {index === active ? (
                  <Link
                    to={slide.href || '/shop'}
                    className="home-banner-slider__slide-link"
                    aria-label={slide.alt || `Promotional banner ${index + 1}`}
                  />
                ) : null}
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="home-banner-slider__dots" role="tablist" aria-label="Choose slide">
              {slides.map((slide, index) => (
                <button
                  key={`dot-${slide.cloudinaryPublicId || slide.src}-${index}`}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={`Slide ${index + 1} of ${slides.length}`}
                  className={`home-banner-slider__dot${index === active ? ' home-banner-slider__dot--active' : ''}`}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
