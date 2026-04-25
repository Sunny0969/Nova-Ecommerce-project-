import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import staffApi from '../../api/staffAxios';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { apiMessage } from '../../lib/api';

function badgeClass(status) {
  if (status === 'pending_approval') return 'badge badge--warn';
  if (status === 'approved') return 'badge badge--success';
  if (status === 'rejected') return 'badge badge--danger';
  return 'badge';
}

export default function StaffProducts() {
  const { hasPermission } = useStaffAuth();
  const can = hasPermission('manageProducts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!can) return;
      setLoading(true);
      setError('');
      try {
        const res = await staffApi.get('/api/staff/products');
        const list = res.data?.data || res.data || [];
        if (!mounted) return;
        setRows(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!mounted) return;
        setError(String(apiMessage(e, 'Could not load products')));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [can]);

  const content = useMemo(() => {
    if (!can) {
      return (
        <div className="api-error-banner" role="alert">
          You don’t have permission to manage products.
        </div>
      );
    }
    if (loading) return <p className="text-muted">Loading…</p>;
    if (error) return <div className="api-error-banner" role="alert">{error}</div>;
    if (!rows.length) {
      return <p className="text-muted">No submitted products yet.</p>;
    }
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((p) => (
          <div key={p._id} className="admin-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 650 }}>{p.name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  {p.slug ? `/shop/${p.slug}` : null}
                </div>
              </div>
              <span className={badgeClass(p.approvalStatus)}>{p.approvalStatus || 'approved'}</span>
            </div>
            {p.approvalStatus === 'rejected' && p.rejectionReason ? (
              <div className="api-error-banner" role="note" style={{ marginTop: 10 }}>
                <strong>Rejected:</strong> {p.rejectionReason}
                <div className="text-muted" style={{ marginTop: 6 }}>
                  You can edit the product and resubmit (it will go back to pending approval).
                </div>
              </div>
            ) : null}
            <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link className="btn btn-outline btn-sm" to={`/admin/products/${encodeURIComponent(p._id)}/edit`}>
                Edit / Resubmit
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  }, [can, loading, error, rows]);

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Products</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>
            Products you submit will be reviewed by admin before publishing.
          </p>
        </div>
        {can ? (
          <Link className="btn btn-primary" to="/admin/products/new">
            Add New Product
          </Link>
        ) : null}
      </div>
      <div style={{ marginTop: 16 }}>{content}</div>
    </div>
  );
}

