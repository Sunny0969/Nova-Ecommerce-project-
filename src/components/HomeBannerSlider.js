import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HOME_BANNER_INTERVAL_MS, HOME_BANNER_SLIDES, HOME_BANNER_WIDTH, HOME_BANNER_HEIGHT } from '../config/homeBannerSlides';
import OptimizedImage from './OptimizedImage';
import './HomeBannerSlider.css';

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

  if (!slides.length) return null;

  const lcpSlide = slides[0];

  return (
    <>
      {lcpSlide?.src ? (
        <Helmet>
          <link rel="preload" as="image" href={lcpSlide.src} fetchpriority="high" />
        </Helmet>
      ) : null}
    <section
      className="home-banner-slider"
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
              key={slide.src + index}
              className="home-banner-slider__slide"
              aria-hidden={index !== active}
            >
              <Link
                to={slide.href || '/shop'}
                className="home-banner-slider__slide-link"
                aria-label={slide.alt || `Promotional banner ${index + 1}`}
                tabIndex={index === active ? 0 : -1}
              >
                <OptimizedImage
                  src={slide.src}
                  alt={slide.alt || `Promotional banner ${index + 1} at Bazaar`}
                  className="home-banner-slider__img"
                  width={HOME_BANNER_WIDTH}
                  height={HOME_BANNER_HEIGHT}
                  priority={index === 0}
                  optimize={false}
                />
              </Link>
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <div className="home-banner-slider__dots" role="tablist" aria-label="Choose slide">
            {slides.map((slide, index) => (
              <button
                key={slide.src + index}
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
