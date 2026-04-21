import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import { getAccountSeoTitle } from '../../utils/seo';
import {
  LayoutDashboard,
  Package,
  User,
  MapPin,
  Heart,
  Star
} from 'lucide-react';

const links = [
  { to: '/account', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/reviews', label: 'My Reviews', icon: Star }
];

function navClass({ isActive }) {
  return `account-nav__link${isActive ? ' account-nav__link--active' : ''}`;
}

export default function AccountLayout() {
  const { pathname } = useLocation();
  return (
    <>
      <SEO
        noIndex
        title={getAccountSeoTitle(pathname)}
        description="Your Nova Shop account: orders, profile, addresses, wishlist, and reviews. Private area, not shown in public search results."
        canonicalUrl={pathname}
      />
      <header className="account-layout__header page-header">
        <div className="container">
          <h1 className="page-header__title">My account</h1>
          <p className="account-layout__subtitle">
            Manage orders, profile, addresses, and more.
          </p>
        </div>
      </header>

      <div className="account-layout container">
        <nav className="account-layout__tabs" aria-label="Account sections">
          <div className="account-layout__tabs-inner">
            {links.map(({ to, end, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                <Icon className="account-nav__icon" size={18} strokeWidth={1.75} aria-hidden />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="account-layout__grid">
          <nav className="account-layout__sidebar account-nav" aria-label="Account sections">
            <ul className="account-nav__list">
              {links.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={navClass}>
                    <Icon className="account-nav__icon" size={18} strokeWidth={1.75} aria-hidden />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="account-layout__main account-outlet">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
