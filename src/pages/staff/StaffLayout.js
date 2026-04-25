import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import staffApi from '../../api/staffAxios';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { apiMessage } from '../../lib/api';

function navLinkClass({ isActive }) {
  return `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`;
}

export default function StaffLayout() {
  const location = useLocation();
  const { staffToken: token, staffUser, hasPermission, permissions, logout, isBlocked, setIsBlocked, setStaffUser, setPermissions } =
    useStaffAuth();
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState('');

  const display = staffUser?.name || staffUser?.email || 'Staff';

  useEffect(() => {
    if (!token) return undefined;
    let mounted = true;
    (async () => {
      setChecking(true);
      setCheckError('');
      try {
        const res = await staffApi.get('/api/staff/me');
        if (!mounted) return;
        const data = res.data?.data || res.data;
        if (data?.status === 'blocked') {
          setIsBlocked(true);
          return;
        }
        setIsBlocked(false);
        if (data?.staff) setStaffUser(data.staff);
        if (data?.permissions) setPermissions(data.permissions);
      } catch (e) {
        if (!mounted) return;
        setCheckError(String(apiMessage(e, 'Could not verify staff access')));
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token, setIsBlocked, setStaffUser, setPermissions]);

  const hasAnyPerm = useMemo(() => Object.values(permissions || {}).some(Boolean), [permissions]);

  if (!token) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  return (
    <>
      <SEO noIndex title="Staff" description="Nova Shop staff console." canonicalUrl={location.pathname} />
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Staff navigation">
          <Link to="/staff/dashboard" className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">Nova</span>
            <span className="admin-sidebar__logo-dot">.</span>
            <span className="admin-sidebar__logo-sub">Staff</span>
          </Link>
          <nav className="admin-sidebar__nav">
            <ul className="admin-sidebar__list">
              <li>
                <NavLink to="/staff/dashboard" className={navLinkClass} end>
                  Dashboard
                </NavLink>
              </li>
              {hasPermission('manageProducts') ? (
                <li>
                  <NavLink to="/staff/products" className={navLinkClass}>
                    Products
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('manageCategories') ? (
                <li>
                  <NavLink to="/staff/categories" className={navLinkClass}>
                    Categories
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('manageOrders') ? (
                <li>
                  <NavLink to="/staff/orders" className={navLinkClass}>
                    Orders
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('manageBlog') ? (
                <li>
                  <NavLink to="/staff/blog" className={navLinkClass}>
                    Blog
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('manageCustomers') ? (
                <li>
                  <NavLink to="/staff/customers" className={navLinkClass}>
                    Customers
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('viewAnalytics') ? (
                <li>
                  <NavLink to="/staff/analytics" className={navLinkClass}>
                    Analytics
                  </NavLink>
                </li>
              ) : null}
              {hasPermission('manageCoupons') ? (
                <li>
                  <NavLink to="/staff/coupons" className={navLinkClass}>
                    Coupons
                  </NavLink>
                </li>
              ) : null}
              <li>
                <button type="button" className="admin-sidebar__link" onClick={logout}>
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="admin-shell__main">
          <header className="admin-topbar">
            <div className="admin-topbar__title">Staff Panel</div>
            <div className="admin-topbar__actions">
              <span className="text-muted">{display}</span>
            </div>
          </header>
          <div className="admin-shell__content">
            {checking ? (
              <div className="container" style={{ padding: '2rem' }}>
                <p className="text-muted">Verifying access…</p>
              </div>
            ) : checkError ? (
              <div className="container" style={{ padding: '2rem' }}>
                <div className="api-error-banner" role="alert">
                  {checkError}
                </div>
              </div>
            ) : isBlocked ? (
              <div className="container" style={{ padding: '2rem' }}>
                <div className="api-error-banner" role="alert">
                  Your access has been blocked. Contact admin.
                </div>
                <button type="button" className="btn btn-outline" style={{ marginTop: 12 }} onClick={logout}>
                  Back to login
                </button>
              </div>
            ) : !hasAnyPerm ? (
              <div className="container" style={{ padding: '2rem' }}>
                <div className="api-error-banner" role="note">
                  You have no permissions assigned. Contact admin.
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

