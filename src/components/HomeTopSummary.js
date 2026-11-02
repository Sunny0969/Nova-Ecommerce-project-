import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Clock, Star } from 'lucide-react';
import './HomeTopSummary.css';

/**
 * Top summary / key-takeaway block placed early on the homepage.
 * Provides direct-answer signals, definition support, audience clarity,
 * and conversational query phrasing for AI extraction (GEO).
 */
export default function HomeTopSummary() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="section home-top-summary" id="what-is-bazaar" aria-label="About Bazaar online store">
      <div className="container">
        <div className="home-top-summary__grid">
          <div className="home-top-summary__content">
            <p className="home-top-summary__eyebrow">Key Takeaway</p>

            <h2 className="home-top-summary__title">
              What Is Bazaar and Who Is It For?
            </h2>

            <p className="home-top-summary__answer">
              <strong>Bazaar is an online shopping platform based in Hyderabad, Pakistan</strong> that
              sells groceries, school supplies, fashion, electronics, and household essentials. It is
              built for families, students, and small businesses in Hyderabad and across Pakistan who
              want quality products delivered to their doorstep at affordable prices.
            </p>

            <p className="home-top-summary__detail">
              Whether you need the best school bag in Hyderabad, weekly grocery delivery, or home
              essentials at the lowest price — Bazaar handles ordering, secure payment (cash on
              delivery or bank transfer), and fast shipping in one place. According to the{' '}
              <a
                href="https://www.statista.com/outlook/emo/ecommerce/pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="home-top-summary__source"
              >
                Pakistan e-commerce market report (Statista, {currentYear})
              </a>
              , online retail in Pakistan is growing rapidly — and Bazaar serves this demand with
              local expertise and reliable delivery.
            </p>

            <div className="home-top-summary__audience">
              <p className="home-top-summary__audience-title">This store is for you if:</p>
              <ul className="home-top-summary__audience-list">
                <li>You live in Hyderabad or anywhere in Pakistan and want doorstep delivery</li>
                <li>You need groceries, school bags, fashion, or electronics at competitive prices</li>
                <li>You prefer cash on delivery or mobile wallet payments (Easypaisa / JazzCash)</li>
                <li>You want a 7-day return policy and responsive customer support</li>
              </ul>
            </div>

            <div className="home-top-summary__cta-row">
              <Link to="/shop" className="btn btn-gold home-top-summary__cta">
                <ShoppingBag size={18} strokeWidth={1.75} aria-hidden />
                Browse Products
              </Link>
              <Link to="/about-us" className="btn btn-outline home-top-summary__cta home-top-summary__cta--ghost">
                Learn About Us
              </Link>
            </div>

            <p className="home-top-summary__date">
              <Clock size={13} strokeWidth={1.75} aria-hidden />
              Last updated: September {currentYear}
            </p>
          </div>

          <div className="home-top-summary__stats">
            <div className="home-top-summary__stat-card">
              <span className="home-top-summary__stat-icon" aria-hidden>
                <ShoppingBag size={22} strokeWidth={1.75} />
              </span>
              <span className="home-top-summary__stat-value">500+</span>
              <span className="home-top-summary__stat-label">Products Available</span>
            </div>

            <div className="home-top-summary__stat-card">
              <span className="home-top-summary__stat-icon" aria-hidden>
                <Users size={22} strokeWidth={1.75} />
              </span>
              <span className="home-top-summary__stat-value">Hyderabad</span>
              <span className="home-top-summary__stat-label">Based &amp; Nationwide Delivery</span>
            </div>

            <div className="home-top-summary__stat-card">
              <span className="home-top-summary__stat-icon" aria-hidden>
                <Star size={22} strokeWidth={1.75} />
              </span>
              <span className="home-top-summary__stat-value">4.8★</span>
              <span className="home-top-summary__stat-label">Average Customer Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
