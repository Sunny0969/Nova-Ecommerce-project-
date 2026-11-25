import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Youtube, Instagram, Facebook, Twitter } from 'lucide-react';
import { businessDisplayName } from '../utils/businessContact';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="fashion-footer" role="contentinfo">
      <div className="container">
        <div className="fashion-footer__grid">
          {/* Brand Col */}
          <div className="fashion-footer__brand">
            <Link to="/" className="fashion-footer__logo">
              <ShoppingBag size={22} className="fashion-footer__logo-icon" />
              <span>{businessDisplayName || 'Fashion'}</span>
            </Link>
            <p className="fashion-footer__tagline">
              Your one-stop destination for trendy and affordable fashion for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div className="fashion-footer__col">
            <h4 className="fashion-footer__heading">Quick Links</h4>
            <ul className="fashion-footer__list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/shop">Shop</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div className="fashion-footer__col">
            <h4 className="fashion-footer__heading">Categories</h4>
            <ul className="fashion-footer__list">
              <li><Link to="/shop?category=men">Men</Link></li>
              <li><Link to="/shop?category=women">Women</Link></li>
              <li><Link to="/shop?category=kids">Kids</Link></li>
              <li><Link to="/shop?category=accessories">Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="fashion-footer__col">
            <h4 className="fashion-footer__heading">Customer Care</h4>
            <ul className="fashion-footer__list">
              <li><Link to="/account/orders">Track Order</Link></li>
              <li><Link to="/returns-and-refunds">Returns &amp; Refunds</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/contact-us">Help Center</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="fashion-footer__col">
            <h4 className="fashion-footer__heading">Follow Us</h4>
            <div className="fashion-footer__socials">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="fashion-footer__social-btn">
                <Youtube size={18} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="fashion-footer__social-btn">
                <Instagram size={18} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="fashion-footer__social-btn">
                <Facebook size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="fashion-footer__social-btn">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="fashion-footer__bottom">
          <p>© {new Date().getFullYear()} {businessDisplayName || 'Bazaar'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
