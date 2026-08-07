import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import SEO from '../../components/SEO';
import '../../styles/admin.css';
import staffApi from '../../api/staffAxios';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { apiMessage } from '../../lib/api';

function navLinkClass({ isActive }) {
  return `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`;
}

export default function StaffLayout() {
  const location = useLocation();

  const {
    staffToken: token,
    staffUser,
    hasPermission,
    permissions,
    logout,
    isBlocked,
    setIsBlocked,
    setStaffUser,
    setPermissions
  } = useStaffAuth();

  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState('');

  const display = staffUser?.name || staffUser?.email || 'Staff';

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    let mounted = true;

    async function verifyStaff() {
      try {
        const res = await staffApi.get('/api/staff/me');

        if (!mounted) return;

        const data = res.data?.data || res.data;

        if (data?.status === 'blocked') {
          setIsBlocked(true);
          return;
        }

        setIsBlocked(false);

        if (data?.staff) {
          setStaffUser(data.staff);
        }

        if (data?.permissions) {
          setPermissions(data.permissions);
        }

      } catch (e) {
        if (!mounted) return;

        setCheckError(apiMessage(e, 'Could not verify staff access'));

        // Token invalid → logout
        logout();
      } finally {
        if (mounted) setChecking(false);
      }
    }

    verifyStaff();

    return () => {
      mounted = false;
    };
  }, [token, setIsBlocked, setStaffUser, setPermissions, logout]);

  const hasAnyPerm = useMemo(
    () => Object.values(permissions || {}).some(Boolean),
    [permissions]
  );

  // Sync permissions strictly from backend each load.
  // Prevents showing stale/old UI if localStorage kept previous staff permissions.
  useEffect(() => {
    if (!token) return;
    if (!permissions) return;
  }, [token, permissions]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (checking) {
    return (
      <div className="admin-shell">
        <div className="admin-shell__content">
          <div className="container" style={{ padding: '2rem' }}>
            <p className="text-muted">Verifying access…</p>
          </div>
        </div>
      </div>
    );
  }

  if (checkError) {
    return (
      <div className="admin-shell">
        <div className="admin-shell__content">
          <div className="container" style={{ padding: '2rem' }}>
            <div className="api-error-banner" role="alert">
              {checkError}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="admin-shell">
        <div className="admin-shell__content">
          <div className="container" style={{ padding: '2rem' }}>
            <div className="api-error-banner" role="alert">
              Your access has been blocked. Contact admin.
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: 12 }}
              onClick={logout}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAnyPerm) {
    return (
      <div className="admin-shell">
        <div className="admin-shell__content">
          <div className="container" style={{ padding: '2rem' }}>
            <div className="api-error-banner" role="note">
              You have no permissions assigned. Contact admin.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user hits /staff/dashboard but doesn't have dashboard permission,
  // send them to the first page they are allowed to see.
  const firstAllowedPath =
    hasPermission('manageProducts')
      ? '/staff/products'
      : hasPermission('manageCategories')
        ? '/staff/categories'
        : hasPermission('manageOrders')
          ? '/staff/orders'
          : '/staff/dashboard';

  if (location.pathname === '/staff/dashboard' && !hasPermission('viewAnalytics')) {
    return <Navigate to={firstAllowedPath} replace />;
  }

  return (
    <>
      <SEO
        noIndex
        title="Staff Panel"
        description="Bazaar staff console."
        canonicalUrl={location.pathname}
      />

      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Staff navigation">
          <Link to="/staff/dashboard" className="admin-sidebar__brand">
            <span className="admin-sidebar__logo">Bazaar</span>
            <span className="admin-sidebar__logo-dot">.</span>
            <span className="admin-sidebar__logo-sub">Staff</span>
          </Link>

          <nav className="admin-sidebar__nav">
            <ul className="admin-sidebar__list">

              {hasPermission('viewAnalytics') && (
                <li>
                  <NavLink to="/staff/dashboard" className={navLinkClass} end>
                    Dashboard
                  </NavLink>
                </li>
              )}


              {hasPermission('manageProducts') && (
                <li>
                  <NavLink to="/staff/products" className={navLinkClass}>
                    Products
                  </NavLink>
                </li>
              )}

              {hasPermission('manageCategories') && (
                <li>
                  <NavLink to="/staff/categories" className={navLinkClass}>
                    Categories
                  </NavLink>
                </li>
              )}

              {hasPermission('manageOrders') && (
                <li>
                  <NavLink to="/staff/orders" className={navLinkClass}>
                    Orders
                  </NavLink>
                </li>
              )}

              {hasPermission('manageBlog') && (
                <li>
                  <NavLink to="/staff/blog" className={navLinkClass}>
                    Blog
                  </NavLink>
                </li>
              )}




              <li>
                <button
                  type="button"
                  className="admin-sidebar__link"
                  onClick={logout}
                >
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
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}