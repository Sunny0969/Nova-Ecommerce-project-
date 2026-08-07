import React, { useEffect, useState } from 'react';
import { Leaf, PartyPopper, RefreshCw } from 'lucide-react';
import { publicAPI, productsAPI } from '../api/storefront';
import { unwrapFeaturedResponse } from '../lib/api';
import { getMaxProductDiscountPercent } from '../lib/productSale';
import './HomeHero.css';

const FEATURES = [
  { icon: Leaf, title: 'Fresh & Fast Delivery', sub: 'Daily fresh items • Same day available' },
  { icon: RefreshCw, title: 'Easy Returns', sub: '7-day policy' }
];

export default function HomeHero() {
  const [stats, setStats] = useState(null);
  const [maxFromProducts, setMaxFromProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [statsRes, flashRes] = await Promise.all([
          publicAPI.homeStats(),
          productsAPI.getFlashSale({ limit: 48 })
        ]);

        if (cancelled) return;

        setStats(statsRes.data?.data || null);

        const flashList = unwrapFeaturedResponse(flashRes);
        setMaxFromProducts(getMaxProductDiscountPercent(flashList));
      } catch {
        if (!cancelled) {
          setStats(null);
          setMaxFromProducts(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const promo = stats?.promo;
  const apiPct = Number(promo?.maxDiscountPercent);
  const maxDiscountPercent = loading
    ? 0
    : Math.max(
        Number.isFinite(apiPct) && apiPct > 0 ? Math.round(apiPct) : 0,
        maxFromProducts
      );

  const renderPromoSub = () => {
    if (loading) return '…';

    const subtitle = promo?.subtitle || 'Limited time • Best prices on Bazaar';
    const deliveryText =
      stats?.deliveryLabel ||
      (() => {
        const bullet = subtitle.indexOf('•');
        if (bullet === -1) return null;
        const tail = subtitle.slice(bullet + 1).trim();
        return /free delivery/i.test(tail) ? tail : null;
      })();

    if (deliveryText) {
      return (
        <>
          Limited time • <strong className="rozana-hero__promo-delivery">{deliveryText}</strong>
        </>
      );
    }

    return subtitle;
  };

  const renderPromoTitle = () => {
    if (loading) {
      return (
        <>
          Sale — Up to <strong className="rozana-hero__promo-pct">…</strong> Off
        </>
      );
    }

    return (
      <>
        Sale — Up to <strong className="rozana-hero__promo-pct">{maxDiscountPercent}%</strong> Off
      </>
    );
  };

  return (
    <section className="rozana-hero" id="rozana-hero" aria-label="Bazaar storefront hero">
      <div className="container rozana-hero__grid">
        <div className="rozana-hero__copy">
          <p className="rozana-hero__eyebrow">Pakistan ka no. 1 online store</p>

          <h1 className="rozana-hero__title">
            Online Shopping Pakistan — sab kuch{' '}
            <span className="rozana-hero__accent">ghar pe</span>, sab se sasti qeemat pe.
          </h1>

          <p className="rozana-hero__lead">
            Groceries, electronics, fashion aur zyada — ek hi jagah. Fast delivery aur best prices.
          </p>

        </div>

        <div className="rozana-hero__panel">
          <div className="rozana-hero__promo" role="region" aria-label="Current promotion">
            <span className="rozana-hero__promo-icon" aria-hidden>
              <PartyPopper size={22} strokeWidth={2.25} />
            </span>
            <div className="rozana-hero__promo-text">
              <p className="rozana-hero__promo-title">{renderPromoTitle()}</p>
              <p className="rozana-hero__promo-sub">{renderPromoSub()}</p>
            </div>
          </div>

          <ul className="rozana-hero__features">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="rozana-hero__feature">
                <span className="rozana-hero__feature-icon" aria-hidden>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <div>
                  <p className="rozana-hero__feature-title">{title}</p>
                  <p className="rozana-hero__feature-sub">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
