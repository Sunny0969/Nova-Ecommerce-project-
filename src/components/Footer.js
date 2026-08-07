import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MapPin, Phone } from 'lucide-react';
import api from '../api/client';
import { unwrapCategoriesResponse, sortCategoriesAlphabetically } from '../lib/api';
import {
  businessDisplayName,
  businessPhoneDisplay,
  businessPhoneE164,
  formatBusinessAddressLine
} from '../utils/businessContact';
import { buildCategoryPath } from '../utils/urls';
import './Footer.css';

const ABOUT_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'All Categories', to: '/#categories' },
  { label: 'All Brands', to: '/brands' },
  { label: 'Blogs', to: '/blog' },
  { label: 'About Us', to: '/about-us' },
  { label: 'Contact Us', to: '/contact-us' },
  { label: 'FAQs', to: '/faqs' }
];

const POLICY_LINKS = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { label: 'Returns & Refunds', to: '/returns-and-refunds' },
  { label: 'Shipping Policy', to: '/shipping-policy' }
];

function splitIntoColumns(items, numCols = 3) {
  const sorted = sortCategoriesAlphabetically(items);
  const cols = Array.from({ length: numCols }, () => []);
  const perCol = Math.ceil(sorted.length / numCols) || 0;
  for (let i = 0; i < numCols; i += 1) {
    cols[i] = sorted.slice(i * perCol, (i + 1) * perCol);
  }
  return cols;
}

const Footer = () => {
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/categories');
        const list = unwrapCategoriesResponse(res);
        if (!cancelled) setCategories(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryColumns = useMemo(() => splitIntoColumns(categories, 3), [categories]);

  const handleNewsletter = (e) => {
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
    <footer className="footer footer--bazaar" role="contentinfo">
      <div className="container">
        <div className="footer-grid footer-grid--store">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              {businessDisplayName}
              <span className="footer-logo__dot">.</span>
            </Link>
            <p className="footer-tagline">
              Premium lifestyle products curated from around the world. Quality you can feel, delivered with care.
            </p>
            <address className="footer-contact" id="footer-contact">
              <p className="footer-contact__name">{businessDisplayName}</p>
              <p className="footer-contact__line">
                <MapPin size={16} strokeWidth={1.75} aria-hidden className="footer-contact__icon" />
                <span>{formatBusinessAddressLine()}</span>
              </p>
              <p className="footer-contact__line">
                <Phone size={16} strokeWidth={1.75} aria-hidden className="footer-contact__icon" />
                <a href={`tel:${businessPhoneE164}`} className="footer-contact__phone">
                  {businessPhoneDisplay}
                </a>
              </p>
            </address>
          </div>

          <div className="footer-col footer-col--about">
            <p className="footer-col__heading">About Us</p>
            <ul className="footer-links">
              {ABOUT_LINKS.map((link) => (
                <li key={link.label}>
                  {link.to.startsWith('/#') ? (
                    <a href={link.to}>{link.label}</a>
                  ) : (
                    <Link to={link.to}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="footer-col__heading footer-col__heading--sub">Policies</p>
            <ul className="footer-links">
              {POLICY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col footer-col--categories">
            <p className="footer-col__heading">Categories</p>
            {categories.length === 0 ? (
              <ul className="footer-links">
                <li>
                  <Link to="/shop">All Products</Link>
                </li>
              </ul>
            ) : (
              <div className="footer-categories__grid">
                {categoryColumns.map((col, colIndex) => (
                  <ul key={colIndex} className="footer-links footer-categories__col">
                    {col.map((cat) => (
                      <li key={cat._id || cat.slug}>
                        <Link to={buildCategoryPath(cat.slug || '')}>
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="footer-newsletter">
          <div className="footer-newsletter__text">
            <p className="footer-newsletter__title">Newsletter</p>
            <p>Subscribe for new arrivals, offers, and style inspiration.</p>
          </div>
          <form className="footer-newsletter__form" onSubmit={handleNewsletter} noValidate>
            <label htmlFor="footer-newsletter-email" className="visually-hidden">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="footer-newsletter__input"
            />
            <button type="submit" className="footer-newsletter__btn">
              Subscribe
            </button>
          </form>
        </div>

        <div className="footer-bottom footer-bottom--bazaar">
          <p className="footer-copyright">
            © {new Date().getFullYear()} {businessDisplayName}. All rights reserved.{' '}
            <Link to="/privacy-policy" className="footer-copyright__link">
              Privacy
            </Link>
            {' · '}
            <Link to="/returns-and-refunds" className="footer-copyright__link">
              Returns
            </Link>
            {' · '}
            <Link to="/shipping-policy" className="footer-copyright__link">
              Shipping
            </Link>
            {' · '}
            <Link to="/terms-and-conditions" className="footer-copyright__link">
              Terms
            </Link>
            . Powered by{' '}
            <a href="https://rathisoft.com" target="_blank" rel="noopener noreferrer">
              <span style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Rathisoft Innovation</span>
            </a>
            .
          </p>
          <div className="footer-payments" role="group" aria-label="Accepted payment methods">
            <span className="footer-pay footer-pay--visa" title="Visa">
              VISA
            </span>
            <span className="footer-pay footer-pay--mc" title="Mastercard">
              Mastercard
            </span>
            <span className="footer-pay footer-pay--paypal" title="PayPal">
              PayPal
            </span>
            <span className="footer-pay footer-pay--stripe" title="Stripe">
              stripe
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
