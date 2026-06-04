import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Tag } from 'lucide-react';
import { publicAPI } from 'api';
import './HomeDealsBanner.css';

const COMING_SOON = 'Coming Soon';

export default function HomeDealsBanner() {
  const [promo, setPromo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await publicAPI.homeStats();
        if (!cancelled) setPromo(res.data?.data?.promo || null);
      } catch {
        if (!cancelled) setPromo(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = loading ? '…' : promo?.title || COMING_SOON;
  const subtitle = loading ? '…' : promo?.subtitle || 'Nayi deals jald yahan dikhen gi.';
  const soon = !loading && !promo;

  return (
    <aside
      className={`home-deals-banner${soon ? ' home-deals-banner--soon' : ''}`}
      aria-label="Deals and offers"
    >
      <span className="home-deals-banner__icon" aria-hidden>
        <Sparkles size={22} strokeWidth={2.25} />
      </span>
      <p className="home-deals-banner__eyebrow">Deals &amp; savings</p>
      <h3 className="home-deals-banner__title">{title}</h3>
      <p className="home-deals-banner__sub">{subtitle}</p>
      <Link to="/shop" className="home-deals-banner__cta">
        <Tag size={16} aria-hidden />
        Deals dekhain
      </Link>
    </aside>
  );
}
