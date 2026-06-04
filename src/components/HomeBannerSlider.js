import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ShoppingCart } from 'lucide-react';
import { publicAPI } from 'api';
import { HOME_BANNER_INTERVAL_MS, HOME_BANNER_SLIDES } from '../config/homeBannerSlides';
import './HomeBannerSlider.css';

export default function HomeBannerSlider() {
  const slides = HOME_BANNER_SLIDES;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shopReady, setShopReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    publicAPI
      .homeStats()
      .then((res) => {
        if (!cancelled) setShopReady(Boolean(res.data?.data?.hasPublishedProducts));
      })
      .catch(() => {
        if (!cancelled) setShopReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
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
              <img
                src={slide.src}
                alt={slide.alt || ''}
                className="home-banner-slider__img"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </div>
          ))}
        </div>

        <div className="home-banner-slider__shade" aria-hidden />

        <div className="home-banner-slider__overlay">
          <div className="home-banner-slider__actions">
            <Link
              to="/shop"
              className={`home-banner-slider__btn home-banner-slider__btn--primary${shopReady ? '' : ' home-banner-slider__btn--muted'}`}
            >
              <ShoppingCart size={18} aria-hidden />
              Abhy Khareedo
            </Link>
            <a href="#rozana-hero" className="home-banner-slider__btn home-banner-slider__btn--ghost">
              <Play size={16} aria-hidden className="home-banner-slider__play-icon" />
              Deals dekhain
            </a>
          </div>

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
        </div>
      </div>
    </section>
  );
}
