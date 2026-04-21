import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  Search,
  User,
  ChevronDown,
  Package,
  LogOut,
  Star
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
// products API autocomplete is superseded by SmartSearchBar (AI + hybrid search)
import SmartSearchBar from './SmartSearchBar';

function useDebouncedCallback(fn, delay) {
  const t = useRef(null);
  return useCallback(
    (...args) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const { count: wishCount } = useWishlist();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const prevCart = useRef(itemCount);

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (prevCart.current !== itemCount) {
      setCartBump(true);
      const id = setTimeout(() => setCartBump(false), 400);
      prevCart.current = itemCount;
      return () => clearTimeout(id);
    }
  }, [itemCount]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setSearchOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onDoc = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [searchOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [accountOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    setAccountOpen(false);
    setSearchOpen(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  // Search results are handled by SmartSearchBar (hybrid AI + keyword)

  const handleLogout = async () => {
    setAccountOpen(false);
    setDrawerOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const isShopActive =
    location.pathname === '/shop' || location.pathname.startsWith('/shop/');
  const isBlogActive = location.pathname.startsWith('/blog');

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const navLinkClass = (active) => `nav-main__link ${active ? 'active' : ''}`;

  const renderNavLinks = (onNavigate) => (
    <>
      <Link to="/" className={navLinkClass(isActive('/'))} onClick={onNavigate}>
        Home
      </Link>
      <Link to="/shop" className={navLinkClass(isShopActive)} onClick={onNavigate}>
        Shop
      </Link>
      <Link to="/blog" className={navLinkClass(isBlogActive)} onClick={onNavigate}>
        Blog
      </Link>
      <Link to="/cart" className={navLinkClass(isActive('/cart'))} onClick={onNavigate}>
        Cart
      </Link>
    </>
  );

  const renderIconButtons = (onNavigate) => (
    <>
      <Link
        to={user ? '/account/wishlist' : '/login'}
        className={`nav-icon-btn ${location.pathname.includes('wishlist') ? 'nav-icon-btn--active' : ''}`}
        aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ''}`}
        onClick={onNavigate}
      >
        <Heart size={22} strokeWidth={1.75} />
        {wishCount > 0 && (
          <span className="nav-badge nav-badge--wish" aria-hidden="true">
            {wishCount > 99 ? '99+' : wishCount}
          </span>
        )}
      </Link>
      <Link
        to="/cart"
        className={`nav-icon-btn ${isActive('/cart') ? 'nav-icon-btn--active' : ''}`}
        aria-label={`Shopping cart, ${itemCount} items`}
        onClick={onNavigate}
      >
        <ShoppingCart size={22} strokeWidth={1.75} />
        {itemCount > 0 && (
          <span
            className={`nav-badge nav-badge--cart ${cartBump ? 'nav-badge--bump' : ''}`}
            aria-hidden="true"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>
    </>
  );

  return (
    <>
      <nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="nav-inner">
          <div className="nav-brand">
            <Link to="/" className="nav-logo" aria-label="Nova Shop Home" onClick={() => setDrawerOpen(false)}>
              Nova<span className="nav-logo__dot">.</span>
            </Link>
            <div className="nav-main nav-main--desktop">{renderNavLinks(() => {})}</div>
          </div>

          <div className="nav-tools">
            <div className={`nav-search ${searchOpen ? 'nav-search--open' : ''}`} ref={searchWrapRef}>
              {!searchOpen ? (
                <button
                  type="button"
                  className="nav-search__trigger"
                  aria-label="Open search"
                  aria-expanded={searchOpen}
                  onClick={openSearch}
                >
                  <Search size={20} strokeWidth={1.75} />
                </button>
              ) : (
                <SmartSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  isOpen={searchOpen}
                  inputRef={searchInputRef}
                  onClose={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  onPick={(picked) => {
                    if (picked?.type === 'product') {
                      navigate(`/shop/${encodeURIComponent(picked.slug)}`);
                    } else if (picked?.type === 'basic') {
                      navigate(`/shop/${encodeURIComponent(picked.slug)}`);
                    } else if (picked?.type === 'query') {
                      navigate(`/shop?search=${encodeURIComponent(picked.query)}`);
                    }
                    setSearchOpen(false);
                  }}
                />
              )}
            </div>

            <div className="nav-tools__icons nav-tools__icons--desktop">{renderIconButtons(() => {})}</div>

            {isAuthenticated ? (
              <div className="nav-account-wrap" ref={accountRef}>
                <button
                  type="button"
                  className="nav-avatar-btn"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <span className="nav-avatar" aria-hidden="true">
                    {getInitials(user?.name)}
                  </span>
                  <ChevronDown size={16} className={`nav-avatar-chevron ${accountOpen ? 'open' : ''}`} />
                </button>
                {accountOpen && (
                  <ul className="nav-dropdown" role="menu">
                    <li>
                      <Link to="/account" role="menuitem" onClick={() => setAccountOpen(false)}>
                        <User size={16} /> My Account
                      </Link>
                    </li>
                    <li>
                      <Link to="/account/orders" role="menuitem" onClick={() => setAccountOpen(false)}>
                        <Package size={16} /> My Orders
                      </Link>
                    </li>
                    <li>
                      <Link to="/account/reviews" role="menuitem" onClick={() => setAccountOpen(false)}>
                        <Star size={16} /> My Reviews
                      </Link>
                    </li>
                    <li>
                      <button type="button" role="menuitem" className="nav-dropdown__logout" onClick={handleLogout}>
                        <LogOut size={16} /> Logout
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <Link to="/login" className="nav-signin-btn">
                Sign In
              </Link>
            )}

            <button
              type="button"
              className="nav-hamburger"
              aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((o) => !o)}
            >
              {drawerOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`nav-drawer-backdrop ${drawerOpen ? 'is-open' : ''}`}
        aria-hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`nav-drawer ${drawerOpen ? 'is-open' : ''}`}
        aria-hidden={!drawerOpen}
        aria-label="Mobile menu"
      >
        <div className="nav-drawer__head">
          <span className="nav-logo">
            Nova<span className="nav-logo__dot">.</span>
          </span>
          <button
            type="button"
            className="nav-drawer__close"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <div className="nav-drawer__links">{renderNavLinks(() => setDrawerOpen(false))}</div>
        <div className="nav-drawer__icons">{renderIconButtons(() => setDrawerOpen(false))}</div>
        {isAuthenticated ? (
          <div className="nav-drawer__auth">
            <button type="button" className="btn btn-outline btn-full" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-signin-btn nav-signin-btn--block" onClick={() => setDrawerOpen(false)}>
            Sign In
          </Link>
        )}
      </aside>
    </>
  );
}
