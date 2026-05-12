import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

/**
 * NewsletterCTA
 * - Lightweight local validation + accessible form.
 */
export default function NewsletterCTA({ compact = false }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = email.trim();
    if (!v) {
      toast.error('Enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error('Please enter a valid email');
      return;
    }
    toast.success('Thanks — you’re on the list!');
    setEmail('');
  };

  return (
    <section className={`section section--blog ${compact ? 'secondary' : 'cta'}`} aria-label="Newsletter signup">
      <div className="container">
        <div className="newsletter-cta">
          <div className="newsletter-cta__left">
            <span className="section-tag">Newsletter</span>
            <h2 className="newsletter-cta__title">Get curated guides in your inbox</h2>
            <p className="newsletter-cta__sub">
              Weekly ideas, smart checklists, and the best time to shop — no spam.
            </p>
          </div>

          <form className="newsletter-cta__form" onSubmit={handleSubmit} noValidate>
            <label className="visually-hidden" htmlFor="blog-newsletter-email">
              Email address
            </label>
            <div className="newsletter-cta__row">
              <span className="newsletter-cta__icon" aria-hidden="true">
                <Mail size={18} strokeWidth={2} />
              </span>
              <input
                id="blog-newsletter-email"
                className="newsletter-cta__input"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="newsletter-cta__btn">
                Subscribe
              </button>
            </div>
            <p className="newsletter-cta__hint">By subscribing, you agree to receive emails from Nova Shop.</p>
          </form>
        </div>
      </div>
    </section>
  );
}

