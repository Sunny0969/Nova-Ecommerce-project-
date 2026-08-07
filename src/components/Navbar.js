import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  Package,
  LogOut,
  Star,
  Search
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getGrantedStaffSections } from '../utils/staffPermissions';
import NavDeliveryLocation from './NavDeliveryLocation';
import { businessDisplayName } from '../utils/businessContact';
import { buildProductPath, getProductCategorySlug, isRootCatalogPath } from '../utils/urls';

const SmartSearchBar = lazy(() =>
  import(/* webpackChunkName: "smart-search-bar" */ './SmartSearchBar')
);

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
  const { user, logout, isAuthenticated, isAdmin, isStaff, canAccessCustomerApp, permissionMap } = useAuth();
  const { count: wishCount } = useWishlist();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchBarActive, setSearchBarActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const prevCart = useRef(itemCount);

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const accountDesktopRef = useRef(null);
  const accountMobileRef = useRef(null);

  const isInsideAccountMenu = (target) => {
    if (!(target instanceof Node)) return false;
    return (
      accountDesktopRef.current?.contains(target) ||
      accountMobileRef.current?.contains(target)
    );
  };

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
        setSearchFocused(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!searchFocused) return;
    const onDoc = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [searchFocused]);

  useEffect(() => {
    if (!accountOpen) return;
    const onDoc = (e) => {
      if (!isInsideAccountMenu(e.target)) {
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
    setSearchFocused(false);
    setSearchBarActive(false);
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchBarActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchBarActive]);

  const activateSearchBar = () => {
    setSearchBarActive(true);
    setSearchFocused(true);
  };

  const handleSearchPick = (picked) => {
    if (picked?.type === 'product') {
      navigate(
        buildProductPath(
          picked.slug,
          getProductCategorySlug(picked.product || { slug: picked.slug })
        )
      );
    } else if (picked?.type === 'basic') {
      navigate(buildProductPath(picked.slug, picked.categorySlug || ''));
    } else if (picked?.type === 'blog' && picked.slug) {
      navigate(`/blog/${encodeURIComponent(picked.slug)}`);
    } else if (picked?.type === 'query') {
      navigate(`/shop?search=${encodeURIComponent(picked.query)}`);
    }
    setSearchFocused(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    setAccountOpen(false);
    setDrawerOpen(false);
    await logout();
    navigate('/home');
  };

  const isHomeActive = location.pathname === '/' || location.pathname === '/home';
  const isActive = (path) => location.pathname === path;
  const isShopActive =
    location.pathname === '/shop' ||
    location.pathname.startsWith('/shop/') ||
    location.pathname.startsWith('/brand/') ||
    isRootCatalogPath(location.pathname);
  const isBlogActive = location.pathname.startsWith('/blog');
  const staffSections = isStaff ? getGrantedStaffSections(permissionMap) : [];

  const navLinkClass = (active) => `nav-main__link ${active ? 'active' : ''}`;

  const renderNavLinks = (onNavigate, tabIndex) => (
    <>
      {/* <Link to="/home" className={navLinkClass(isHomeActive)} onClick={onNavigate} tabIndex={tabIndex}>
        Home
      </Link>
      <Link to="/shop" className={navLinkClass(isShopActive)} onClick={onNavigate} tabIndex={tabIndex}>
        Shop
      </Link>
      <Link to="/blog" className={navLinkClass(isBlogActive)} onClick={onNavigate} tabIndex={tabIndex}>
        Blog
      </Link> */}
        {/* <Link to="/cart" className={navLinkClass(isActive('/cart'))} onClick={onNavigate} tabIndex={tabIndex}>
          Cart
        </Link> */}
    </>
  );

  const renderRoleLinks = (onNavigate, tabIndex) => (
    <>
      {isAdmin ? (
        <Link
          to="/admin/dashboard"
          className={navLinkClass(location.pathname.startsWith('/admin'))}
          onClick={onNavigate}
          tabIndex={tabIndex}
        >
          Admin Panel
        </Link>
      ) : null}
      {staffSections.map((section) => (
        <Link
          key={section.permission}
          to={section.path}
          className={navLinkClass(location.pathname.startsWith(section.path))}
          onClick={onNavigate}
          tabIndex={tabIndex}
        >
          {section.label}
        </Link>
      ))}
    </>
  );

  const renderIconButtons = (onNavigate, tabIndex) => (
    <>
      <Link
        to="/wishlist"
        className={`nav-icon-btn ${location.pathname.includes('wishlist') ? 'nav-icon-btn--active' : ''}`}
        aria-label={`Wishlist${wishCount ? `, ${wishCount} items` : ''}`}
        onClick={onNavigate}
        tabIndex={tabIndex}
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
        tabIndex={tabIndex}
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

  const renderProfileControl = (onNavigate, wrapRef, menuId, tabIndex) => {
    if (isAuthenticated) {
      return (
        <div className="nav-account-wrap" ref={wrapRef}>
          <button
            type="button"
            className="nav-avatar-btn"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            aria-label="Account menu"
            tabIndex={tabIndex}
            onClick={() => setAccountOpen((o) => !o)}
          >
            <span className="nav-avatar" aria-hidden="true">
              {getInitials(user?.name)}
            </span>
            <ChevronDown size={16} className={`nav-avatar-chevron ${accountOpen ? 'open' : ''}`} />
          </button>
          {accountOpen && (
            <ul id={menuId} className="nav-dropdown" role="menu">
              {canAccessCustomerApp ? (
                <>
                  <li>
                    <Link
                      to="/account"
                      role="menuitem"
                      tabIndex={tabIndex}
                      onClick={() => {
                        setAccountOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <User size={16} /> My Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/account/orders"
                      role="menuitem"
                      tabIndex={tabIndex}
                      onClick={() => {
                        setAccountOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <Package size={16} /> My Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/account/reviews"
                      role="menuitem"
                      tabIndex={tabIndex}
                      onClick={() => {
                        setAccountOpen(false);
                        onNavigate?.();
                      }}
                    >
                      <Star size={16} /> My Reviews
                    </Link>
                  </li>
                </>
              ) : null}
              <li>
                <button
                  type="button"
                  role="menuitem"
                  className="nav-dropdown__logout"
                  tabIndex={tabIndex}
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      );
    }

    return (
      <Link
        to="/login"
        className={`nav-icon-btn ${isActive('/login') ? 'nav-icon-btn--active' : ''}`}
        aria-label="Sign in"
        onClick={onNavigate}
        tabIndex={tabIndex}
      >
        <User size={22} strokeWidth={1.75} />
      </Link>
    );
  };

  return (
    <>
      <nav
        className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
        aria-label="Main navigation"
      >
        <div className="nav-inner">
          <div className="nav-brand">
            <Link to="/" className="nav-logo" aria-label="Bazaar Home" onClick={() => setDrawerOpen(false)}>
              {businessDisplayName}
              <span className="nav-logo__dot">.</span>
            </Link>
            <NavDeliveryLocation className="nav-location--desktop" />
            <div className="nav-main nav-main--desktop">
              {renderNavLinks(() => {})}
              {renderRoleLinks(() => {})}
            </div>
          </div>

          <div className="nav-search nav-search--inline" ref={searchWrapRef}>
            {searchBarActive ? (
              <Suspense
                fallback={
                  <div className="nav-search__field" aria-busy="true">
                    <span className="nav-search__submit" aria-hidden="true">
                      <Search size={18} strokeWidth={1.75} className="nav-search__icon" />
                    </span>
                    <input
                      className="nav-search__input"
                      type="search"
                      readOnly
                      placeholder="Loading search…"
                      aria-label="Search products"
                    />
                  </div>
                }
              >
                <SmartSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  isOpen={searchFocused}
                  inputRef={searchInputRef}
                  persistent
                  onFocus={() => setSearchFocused(true)}
                  onPick={handleSearchPick}
                />
              </Suspense>
            ) : (
              <div className="nav-search__field">
                <span className="nav-search__submit" aria-hidden="true">
                  <Search size={18} strokeWidth={1.75} className="nav-search__icon" />
                </span>
                <input
                  className="nav-search__input"
                  type="search"
                  placeholder="Search products, blogs & more…"
                  aria-label="Search products"
                  onFocus={activateSearchBar}
                  onClick={activateSearchBar}
                />
              </div>
            )}
          </div>

          <div className="nav-tools nav-tools--desktop">
            <div className="nav-tools__icons">{renderIconButtons(() => {})}</div>
            {renderProfileControl(() => {}, accountDesktopRef, 'nav-account-menu-desktop')}

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

      {drawerOpen ? (
        <>
          <button
            type="button"
            className="nav-drawer-backdrop nav-drawer-backdrop--desktop is-open"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <nav
            className="nav-drawer nav-drawer--desktop is-open"
            aria-label="Mobile navigation"
            aria-modal="true"
          >
            <div className="nav-drawer__head">
              <Link to="/" className="nav-logo nav-drawer__brand" onClick={() => setDrawerOpen(false)}>
                {businessDisplayName}
                <span className="nav-logo__dot">.</span>
              </Link>
              <button
                type="button"
                className="nav-drawer__close"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={22} />
              </button>
            </div>
            <div className="nav-drawer__links">
              {renderNavLinks(() => setDrawerOpen(false))}
              {renderRoleLinks(() => setDrawerOpen(false))}
            </div>
            <div className="nav-drawer__location">
              <NavDeliveryLocation />
            </div>
            <div className="nav-drawer__icons">
              {renderIconButtons(() => setDrawerOpen(false))}
              {renderProfileControl(
                () => setDrawerOpen(false),
                accountMobileRef,
                'nav-account-menu-mobile'
              )}
            </div>
            {isAuthenticated ? (
              <div className="nav-drawer__auth">
                <button type="button" className="btn btn-outline btn-full" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : null}
          </nav>
        </>
      ) : null}
    </>
  );
}