import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import './HomeHero.css';

const DEFAULT_SLIDES = [
  {
    _id: 'default-1',
    title: 'Trendy fashion for Every Style',
    subtitle: 'Discover the latest outfits, accessories and more for men, women and kids.',
    tag: 'NEW COLLECTION',
    badge: 'Flat 30% Off',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    link: '/shop',
    buttonText: 'Shop Now'
  },
  {
    _id: 'default-2',
    title: 'Mega Tech & Smart Gadgets',
    subtitle: 'Premium smartwatches, wireless earbuds, and daily accessories on special price.',
    tag: 'FLASH DEALS',
    badge: 'Up to 50% Off',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    link: '/shop',
    buttonText: 'Explore Tech'
  },
  {
    _id: 'default-3',
    title: 'Fresh Grocery & Daily Mart',
    subtitle: 'Top quality spices, pantry goods and everyday essentials delivered right to your door.',
    tag: 'DAILY ESSENTIALS',
    badge: 'Save Up to 40%',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    link: '/shop',
    buttonText: 'Shop Grocery'
  }
];

export default function HomeHero() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Fetch active banners from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/public/banners');
        const list = res?.data?.data || res?.data;
        if (!cancelled && Array.isArray(list) && list.length > 0) {
          setSlides(list);
        }
      } catch (err) {
        // Fallback to defaults cleanly
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay timer
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused, total, nextSlide]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const delta = touchStartX.current - touchEndX.current;
    if (delta > 50) {
      // Swiped left -> next
      nextSlide();
    } else if (delta < -50) {
      // Swiped right -> prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = slides[currentIndex] || DEFAULT_SLIDES[0];

  return (
    <section
      className="fashion-hero-section"
      aria-label="Promotional banner carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container">
        <div className="fashion-hero-card">
          {/* Navigation Arrows */}
          {total > 1 && (
            <>
              <button
                type="button"
                className="fashion-hero-nav-arrow fashion-hero-nav-arrow--prev"
                onClick={prevSlide}
                aria-label="Previous banner"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="fashion-hero-nav-arrow fashion-hero-nav-arrow--next"
                onClick={nextSlide}
                aria-label="Next banner"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* Left Text Content */}
          <div className="fashion-hero-card__content">
            <div className="fashion-hero-card__tag">
              <Sparkles size={13} className="fashion-hero-card__tag-icon" />
              <span>{current.tag || 'PROMOTION'}</span>
            </div>

            <h1 className="fashion-hero-card__title">
              {current.title}
            </h1>

            <p className="fashion-hero-card__desc">
              {current.subtitle || 'Discover premium products with fast delivery across Pakistan.'}
            </p>

            <div className="fashion-hero-card__actions">
              <Link to={current.link || '/shop'} className="fashion-hero-btn">
                <span>{current.buttonText || 'Shop Now'}</span>
                <ArrowRight size={17} strokeWidth={2.2} />
              </Link>
            </div>

            {/* Slider Dots */}
            {total > 1 && (
              <div className="fashion-hero-dots" role="tablist" aria-label="Slider Pagination">
                {slides.map((slide, idx) => (
                  <button
                    key={slide._id || idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIndex}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`fashion-hero-dot ${idx === currentIndex ? 'fashion-hero-dot--active' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Visual Cutout */}
          <div className="fashion-hero-card__media">
            <div className="fashion-hero-card__img-wrap">
              <img
                src={current.imageUrl}
                alt={current.title}
                className="fashion-hero-card__img"
                loading="eager"
                key={current.imageUrl}
              />
              {current.badge && (
                <div className="fashion-hero-card__badge-float">
                  <span className="fashion-hero-card__badge-txt">{current.badge}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
