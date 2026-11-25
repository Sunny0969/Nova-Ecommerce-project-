import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import './HomeSeasonSaleBanner.css';

export default function HomeSeasonSaleBanner() {
  return (
    <section className="season-sale-section" aria-label="Season sale banner">
      <div className="container">
        <div className="season-sale-card">
          {/* Left Text */}
          <div className="season-sale-card__content">
            <span className="season-sale-card__eyebrow">Season Sale</span>
            <h2 className="season-sale-card__title">Up to 60% Off</h2>
            <p className="season-sale-card__sub">On Selected Fashion &amp; Lifestyle Items</p>
            <Link to="/shop" className="season-sale-btn">
              <span>Shop Now</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          </div>

          {/* Right Visual 3D Shopping Bags */}
          <div className="season-sale-card__media">
            <div className="season-sale-bags-cluster">
              <div className="season-sale-bag season-sale-bag--purple">
                <ShoppingBag size={56} className="season-sale-bag__icon" />
                <span className="season-sale-tag">%</span>
              </div>
              <div className="season-sale-bag season-sale-bag--white">
                <Sparkles size={36} className="season-sale-bag__spark" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
