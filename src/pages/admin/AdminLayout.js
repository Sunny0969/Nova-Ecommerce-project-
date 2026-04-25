import React, { useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import { getAdminSeoTitle } from '../../utils/seo';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LayoutGrid,
  Users,
  TicketPercent,
  BarChart3,
  SlidersHorizontal,
  Shield,
  UserCog,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from 'api';

const NAV_LINKS = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/categories', label: 'Categories', icon: LayoutGrid },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/fraud', label: 'Fraud', icon: Shield },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/store-settings', label: 'Shipping & tax', icon: SlidersHorizontal },
  { to: '/admin/staff', label: 'Staff', icon: UserCog }
];

function navLinkClass({ isActive }) {
  return `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`;
}

function formatBreadcrumbLabel(segment, allSegments, index) {
  if (/^[a-f\d]{24}$/i.test(segment)) {
    if (allSegments[index + 1] === 'edit') return 'Product';
    if (allSegments[index - 1] === 'orders') return 'Order';
    return 'Details';
  }
  if (segment === 'new') return 'New';
  if (segment === 'edit') return 'Edit';
  if (segment === 'store-settings') return 'Shipping & tax';
  if (!segment) return 'Dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function useAdminBreadcrumbs() {
  const { pathname } = useLocation();
  return useMemo(() => {
    const normalized = pathname.replace(/\/$/, '') || '/admin';
    if (normalized === '/admin') {
      return [
        { label: 'Admin', to: '/admin' },
        { label: 'Dashboard' }
      ];
    }
    const segs = normalized.split('/').filter(Boolean);
    const afterAdmin = segs.slice(1);
    const out = [{ label: 'Admin', to: '/admin' }];
    let acc = '/admin';
    for (let i = 0; i < afterAdmin.length; i++) {
      const seg = afterAdmin[i];
      const isLast = i === afterAdmin.length - 1;
      acc += `/${seg}`;
      const label = formatBreadcrumbLabel(seg, afterAdmin, i);
      if (isLast) out.push({ label });
      else out.push({ label, to: acc });
    }
    return out;
  }, [pathname]);
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const crumbs = useAdminBreadcrumbs();
  const [pendingCount, setPendingCount] = React.useState(0);

  const displayName = user?.name || user?.email || 'Admin';

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await adminAPI.products.pendingApprovals();
        const list = res.data?.data || res.data;
        const n = Array.isArray(list) ? list.length : 0;
        if (mounted) setPendingCount(n);
      } catch (e) {
        if (mounted) setPendingCount(0);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SEO
        noIndex
        title={getAdminSeoTitle(pathname)}
        description="Nova Shop admin: manage products, orders, and store settings. Not for public search indexing."
        canonicalUrl={pathname}
      />
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Admin navigation">
          <Link to="/admin" className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">Nova</span>
            <span className="admin-sidebar__logo-dot">.</span>
            <span className="admin-sidebar__logo-sub">Admin</span>
          </Link>
          <nav className="admin-sidebar__nav">
            <ul className="admin-sidebar__list">
              {NAV_LINKS.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={navLinkClass} title={label}>
                    <Icon className="admin-sidebar__icon" size={20} strokeWidth={1.75} aria-hidden />
                    <span className="admin-sidebar__label">{label}</span>
                    {to === '/admin/products' && pendingCount > 0 ? (
                      <span
                        className="nav-badge nav-badge--cart"
                        style={{
                          position: 'static',
                          marginLeft: 'auto',
                          transform: 'none'
                        }}
                        aria-label={`${pendingCount} pending approvals`}
                      >
                        {pendingCount}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="admin-shell__main">
          <header className="admin-topbar">
            <nav className="admin-breadcrumb" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={`${c.label}-${i}`} className="admin-breadcrumb__item">
                  {i > 0 && <ChevronRight className="admin-breadcrumb__sep" size={14} aria-hidden />}
                  {c.to && i < crumbs.length - 1 ? (
                    <Link to={c.to} className="admin-breadcrumb__link">
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        i === crumbs.length - 1
                          ? 'admin-breadcrumb__current'
                          : 'admin-breadcrumb__static'
                      }
                    >
                      {c.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
            <div className="admin-topbar__actions">
              <button
                type="button"
                className="admin-topbar__icon-btn"
                aria-label="Notifications (demo)"
                title="Notifications"
              >
                <Bell size={20} strokeWidth={1.75} />
              </button>
              <span className="admin-topbar__user" title={displayName}>
                {displayName}
              </span>
              <button
                type="button"
                className="admin-topbar__logout"
                onClick={() => logout()}
                title="Log out"
              >
                <LogOut size={18} strokeWidth={1.75} />
                <span className="admin-topbar__logout-txt">Logout</span>
              </button>
            </div>
          </header>
          <div className="admin-content">
            <Outlet />
          </div>
        </div>

        <nav className="admin-bottom-nav" aria-label="Admin navigation">
          {NAV_LINKS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-bottom-nav__item${isActive ? ' is-active' : ''}`}
            >
              <Icon size={22} strokeWidth={1.75} />
              <span className="admin-bottom-nav__label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
