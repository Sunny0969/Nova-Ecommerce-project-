import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Store, Percent, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { isRootCatalogPath } from '../utils/urls';
import './MobileBottomNav.css';

const TABS = [
  { id: 'home', label: 'Home', to: '/', icon: Home, match: (path) => path === '/' || path === '/home' },
  {
    id: 'shop',
    label: 'Shop',
    to: '/shop',
    icon: Store,
    match: (path, searchParams) => {
      const onSale = searchParams.get('onSale') === 'true';
      if (onSale) return false;
      return (
        path === '/shop' ||
        path.startsWith('/shop/') ||
        path.startsWith('/brand/') ||
        isRootCatalogPath(path)
      );
    }
  },
  {
    id: 'sale',
    label: 'Sale',
    to: '/shop?onSale=true',
    icon: Percent,
    saleHighlight: true,
    match: (path, searchParams) =>
      searchParams.get('onSale') === 'true' &&
      (path === '/shop' || path.startsWith('/shop/') || isRootCatalogPath(path))
  },
  {
    id: 'cart',
    label: 'Cart',
    to: '/cart',
    icon: ShoppingCart,
    match: (path) => path === '/cart' || path.startsWith('/checkout')
  },
  {
    id: 'account',
    label: 'Account',
    icon: User,
    match: (path) => path.startsWith('/account') || path === '/login' || path === '/register'
  }
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { itemCount } = useCart();
  const { isAuthenticated, canAccessCustomerApp } = useAuth();

  const accountTo = isAuthenticated && canAccessCustomerApp ? '/account' : '/login';

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
      {TABS.map(({ id, label, to, icon: Icon, match, saleHighlight }) => {
        const href = id === 'account' ? accountTo : to;
        const active = match(pathname, searchParams);
        const classNames = [
          'mobile-bottom-nav__item',
          active && !saleHighlight ? 'mobile-bottom-nav__item--active' : '',
          saleHighlight ? 'mobile-bottom-nav__item--sale' : '',
          saleHighlight && active ? 'mobile-bottom-nav__item--sale-active' : ''
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Link
            key={id}
            to={href}
            className={classNames}
            aria-current={active ? 'page' : undefined}
            aria-label={id === 'cart' && itemCount > 0 ? `Cart, ${itemCount} items` : undefined}
          >
            <span className="mobile-bottom-nav__icon-wrap">
              <Icon size={22} strokeWidth={1.85} aria-hidden />
              {id === 'cart' && itemCount > 0 ? (
                <span className="mobile-bottom-nav__badge" aria-hidden>
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </span>
            <span className="mobile-bottom-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
