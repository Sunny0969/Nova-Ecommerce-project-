import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

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
    <footer className="footer footer--nova" role="contentinfo">
      <div className="container">
        <div className="footer-grid footer-grid--nova">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Nova<span className="footer-logo__dot">.</span>
            </Link>
            <p className="footer-tagline">
              Premium lifestyle products curated from around the world. Quality you can feel, delivered with care.
            </p>
            <div className="footer-socials" aria-label="Social media">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.75} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Twitter"
              >
                <Twitter size={18} strokeWidth={1.75} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.75} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
                aria-label="YouTube"
              >
                <Youtube size={18} strokeWidth={1.75} />
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul className="footer-links">
              <li>
                <Link to="/shop">All Products</Link>
              </li>
              <li>
                <Link to="/shop?category=electronics">Electronics</Link>
              </li>
              <li>
                <Link to="/shop?category=fashion">Fashion</Link>
              </li>
              <li>
                <Link to="/shop?category=home">Home &amp; Living</Link>
              </li>
              <li>
                <Link to="/shop?category=beauty">Beauty</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <ul className="footer-links">
              <li>
                <Link to="/login">Sign In</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
              <li>
                <Link to="/cart">My Cart</Link>
              </li>
              <li>
                <Link to="/account/orders">My Orders</Link>
              </li>
              <li>
                <Link to="/account/wishlist">Wishlist</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Help</h4>
            <ul className="footer-links">
              <li>
                <Link to="#">Shipping Info</Link>
              </li>
              <li>
                <Link to="#">Returns Policy</Link>
              </li>
              <li>
                <Link to="#">Track Order</Link>
              </li>
              <li>
                <Link to="#">Contact Us</Link>
              </li>
              <li>
                <Link to="#">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-newsletter">
          <div className="footer-newsletter__text">
            <h4 className="footer-newsletter__title">Newsletter</h4>
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

        <div className="footer-bottom footer-bottom--nova">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Nova Shop. All rights reserved. Powered by Rathisoft Innovation.
          </p>
          <div className="footer-payments" aria-label="Accepted payment methods">
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
