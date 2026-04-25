import React, { useEffect, useMemo, useState } from 'react';
import staffApi from '../../api/staffAxios';
import { apiMessage } from '../../lib/api';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function StaffDashboard() {
  const { staffUser, permissions, hasPermission } = useStaffAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const permList = useMemo(
    () => [
      ['manageProducts', 'Manage products'],
      ['manageCategories', 'Manage categories'],
      ['manageOrders', 'Manage orders'],
      ['manageBlog', 'Manage blog'],
      ['manageCustomers', 'Manage customers'],
      ['viewAnalytics', 'View analytics'],
      ['manageCoupons', 'Manage coupons']
    ],
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        if (!hasPermission('viewAnalytics')) {
          setStats(null);
          return;
        }
        const res = await staffApi.get('/api/admin/dashboard/stats');
        if (!mounted) return;
        setStats(res.data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setError(String(apiMessage(e, 'Could not load dashboard stats')));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hasPermission]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="api-error-banner" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1 style={{ marginTop: 0 }}>
        Welcome{staffUser?.name ? `, ${staffUser.name}` : ''}
      </h1>

      <div className="admin-card" style={{ padding: 16, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>Your Access Permissions</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {permList.map(([key, label]) => {
            const yes = Boolean(permissions?.[key]);
            return (
              <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {yes ? (
                  <CheckCircle2 size={18} aria-hidden />
                ) : (
                  <XCircle size={18} aria-hidden style={{ opacity: 0.55 }} />
                )}
                <span style={{ opacity: yes ? 1 : 0.65 }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="admin-card" style={{ padding: 16, marginTop: 14 }}>
        <h2 style={{ marginTop: 0, marginBottom: 10 }}>Quick actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {hasPermission('manageProducts') ? (
            <a className="btn btn-outline btn-sm" href="/staff/products">
              Products
            </a>
          ) : null}
          {hasPermission('manageCategories') ? (
            <a className="btn btn-outline btn-sm" href="/staff/categories">
              Categories
            </a>
          ) : null}
          {hasPermission('manageOrders') ? (
            <a className="btn btn-outline btn-sm" href="/staff/orders">
              Orders
            </a>
          ) : null}
          {hasPermission('manageCustomers') ? (
            <a className="btn btn-outline btn-sm" href="/staff/customers">
              Customers
            </a>
          ) : null}
          {hasPermission('viewAnalytics') ? (
            <a className="btn btn-outline btn-sm" href="/staff/analytics">
              Analytics
            </a>
          ) : null}
          {hasPermission('manageCoupons') ? (
            <a className="btn btn-outline btn-sm" href="/staff/coupons">
              Coupons
            </a>
          ) : null}
        </div>
        {!Object.values(permissions || {}).some(Boolean) ? (
          <div className="api-error-banner" role="note" style={{ marginTop: 12 }}>
            You have no permissions assigned. Contact admin.
          </div>
        ) : null}
      </div>

      {hasPermission('viewAnalytics') ? (
        <div className="admin-card" style={{ padding: 16, marginTop: 14 }}>
          <h2 style={{ marginTop: 0, marginBottom: 10 }}>Basic stats</h2>
          {stats ? (
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(stats, null, 2)}</pre>
          ) : (
            <p className="text-muted">No stats available.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

