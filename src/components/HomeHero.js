import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Leaf,
  PartyPopper,
  RefreshCw,
  Zap
} from 'lucide-react';
import { publicAPI } from 'api';
import './HomeHero.css';

const COMING_SOON = 'Coming Soon';

const FEATURES = [
  { icon: Leaf, title: 'Fresh Grocery', sub: 'Daily fresh items' },
  { icon: Zap, title: 'Express Delivery', sub: 'Same day available' },
  { icon: Banknote, title: 'Cash on Delivery', sub: 'Nationwide' },
  { icon: RefreshCw, title: 'Easy Returns', sub: '7-day policy' }
];

export default function HomeHero() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await publicAPI.homeStats();
        if (!cancelled) setStats(res.data?.data || null);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const promo = stats?.promo;
  const promoTitle = loading ? '…' : promo?.title || COMING_SOON;
  const promoSub = loading ? '…' : promo?.subtitle || COMING_SOON;

  return (
    <section className="rozana-hero" id="rozana-hero" aria-label="Rozana storefront hero">
      <div className="container rozana-hero__grid">
        <div className="rozana-hero__copy">
          <p className="rozana-hero__eyebrow">Pakistan ka no. 1 online store</p>

          <h1 className="rozana-hero__title">
            Sab kuch <span className="rozana-hero__accent">ghar pe</span>, sab se sasti qeemat pe.
          </h1>

          <p className="rozana-hero__lead">
            Groceries, electronics, fashion aur zyada — ek hi jagah. Fast delivery, best prices,
            cash on delivery.
          </p>

        </div>

        <div className="rozana-hero__panel">
          <div
            className={`rozana-hero__promo ${!promo && !loading ? 'rozana-hero__promo--soon' : ''}`}
            role="region"
            aria-label="Current promotion"
          >
            <span className="rozana-hero__promo-icon" aria-hidden>
              <PartyPopper size={22} strokeWidth={2.25} />
            </span>
            <div className="rozana-hero__promo-text">
              <p className="rozana-hero__promo-title">{promoTitle}</p>
              <p className="rozana-hero__promo-sub">{promoSub}</p>
            </div>
          </div>

          <div className="rozana-hero__features" role="list">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="rozana-hero__feature" role="listitem">
                <span className="rozana-hero__feature-icon" aria-hidden>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <div>
                  <p className="rozana-hero__feature-title">{title}</p>
                  <p className="rozana-hero__feature-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
