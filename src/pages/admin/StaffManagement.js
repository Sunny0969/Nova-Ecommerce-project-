import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Shield, Trash2, Ban, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { adminAPI } from '../../api/adminApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiMessage } from '../../lib/api';
import { buildProductPath, getProductCategorySlug } from '../../utils/urls';

const formFieldClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

const PERM_SPECS = [
  {
    key: 'manageProducts',
    label: 'Manage Products',
    note: 'requires admin approval to publish'
  },
  { key: 'manageCategories', label: 'Manage Categories' },
  { key: 'manageOrders', label: 'Manage Orders' },
  { key: 'viewAnalytics', label: 'View Analytics' },
  {
    key: 'manageBlog',
    label: 'Manage Blog',
    note: 'requires admin approval to publish'
  },
  { key: 'manageCustomers', label: 'Manage Customers' },
  { key: 'manageCoupons', label: 'Manage Coupons' }
];

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'blocked') return <span className="admin-dash-badge admin-dash-badge--rejected">Blocked</span>;
  return <span className="admin-dash-badge admin-dash-badge--delivered">Active</span>;
}

function permBadges(perms) {
  const p = perms && typeof perms === 'object' ? perms : {};
  const granted = PERM_SPECS.filter((x) => p[x.key] === true);
  if (!granted.length) return <span className="text-muted">—</span>;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {granted.map((g) => {
        let label = g.label;
        if (g.key === 'manageOrders') {
          label = p.orderScope === 'own_products' ? 'Orders (Own Products)' : 'Orders (All)';
        }
        if (g.key === 'manageCustomers') {
          label = p.customerScope === 'own_orders' ? 'Customers (Own Products/Orders)' : 'Customers (All)';
        }
        return (
          <span
            key={g.key}
            className="admin-dash-badge"
            style={{ background: '#1A1A2E', color: '#F97316' }}
            title={g.note || g.label}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function StaffManagement() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // approvals
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [blockRow, setBlockRow] = useState(null);
  const [removeRow, setRemoveRow] = useState(null);

  // add form
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPerms, setAddPerms] = useState(() => ({}));
  const [createdCreds, setCreatedCreds] = useState(null);

  // edit form
  const [editPerms, setEditPerms] = useState(() => ({}));

  // block form
  const [blockChoice, setBlockChoice] = useState('24h');

  // admin management
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'admins' | 'pending'
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [addAdminName, setAddAdminName] = useState('');
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminPassword, setAddAdminPassword] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await adminAPI.staff.listAdmins();
      const list = res.data?.data || res.data || [];
      setAdmins(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load administrator accounts'));
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.staff.list();
      const list = res.data?.data || res.data?.staff || res.data;
      setStaff(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load staff members'));
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await adminAPI.products.pendingApprovals();
      const list = res.data?.data || res.data?.products || res.data;
      setPending(Array.isArray(list) ? list : []);
    } catch (e) {
      setPending([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
    loadPending();
    loadAdmins();
  }, [loadStaff, loadPending, loadAdmins]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!addAdminName.trim() || !addAdminEmail.trim() || !addAdminPassword) {
      toast.error('Name, email, and password are required');
      return;
    }
    setAdminSaving(true);
    try {
      await adminAPI.staff.createAdmin({
        name: addAdminName.trim(),
        email: addAdminEmail.trim(),
        password: addAdminPassword
      });
      toast.success('Administrator account created successfully');
      setAddAdminOpen(false);
      setAddAdminName('');
      setAddAdminEmail('');
      setAddAdminPassword('');
      loadAdmins();
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to create admin'));
    } finally {
      setAdminSaving(false);
    }
  };

  const handleDeleteAdmin = async (adm) => {
    if (!window.confirm(`Are you sure you want to delete admin account "${adm.name}" (${adm.email})?`)) {
      return;
    }
    try {
      await adminAPI.staff.removeAdmin(adm._id);
      toast.success('Admin account removed');
      loadAdmins();
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to delete admin'));
    }
  };

  const loginUrl = useMemo(() => `${window.location.origin}/login`, []);

  const togglePerm = (setter) => (key) => {
    setter((prev) => ({ ...(prev || {}), [key]: !prev?.[key] }));
  };

  const openAdd = () => {
    setCreatedCreds(null);
    setAddName('');
    setAddEmail('');
    setAddPassword('');
    setAddPerms({});
    setAddOpen(true);
  };

  const createStaff = async () => {
    if (!addName.trim() || !addEmail.trim() || !addPassword) {
      toast.error('Name, email, and password are required');
      return;
    }
    try {
      const body = {
        name: addName.trim(),
        email: addEmail.trim(),
        password: addPassword,
        permissions: addPerms || {}
      };
      const res = await adminAPI.staff.create(body);
      const created = res.data?.data || res.data;
      toast.success('Staff member created');
      setCreatedCreds({ email: body.email, password: body.password });
      setStaff((prev) => [created, ...(prev || [])]);
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to create staff'));
    }
  };

  const copyAll = async () => {
    if (!createdCreds) return;
    const text = [
      'Share these credentials with the staff member',
      `Email: ${createdCreds.email}`,
      `Password: ${createdCreds.password}`,
      `Login URL: ${loginUrl}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditPerms(row?.permissions && typeof row.permissions === 'object' ? row.permissions : {});
  };

  const saveEdit = async () => {
    if (!editRow?._id) return;
    try {
      setBusyId(String(editRow._id));
      const res = await adminAPI.staff.updatePermissions(editRow._id, editPerms || {});
      const updated = res.data?.data || res.data;
      setStaff((prev) => (prev || []).map((s) => (String(s._id) === String(editRow._id) ? updated : s)));
      toast.success('Permissions updated');
      setEditRow(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to update permissions'));
    } finally {
      setBusyId(null);
    }
  };

  const doBlock = async () => {
    if (!blockRow?._id) return;
    const duration =
      blockChoice === '1h' ? 1 : blockChoice === '24h' ? 24 : blockChoice === '7d' ? 24 * 7 : 0;
    try {
      setBusyId(String(blockRow._id));
      const res = await adminAPI.staff.block(blockRow._id, duration);
      const updated = res.data?.data || res.data;
      setStaff((prev) => (prev || []).map((s) => (String(s._id) === String(blockRow._id) ? updated : s)));
      toast.success('Staff blocked');
      setBlockRow(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to block staff'));
    } finally {
      setBusyId(null);
    }
  };

  const doUnblock = async (row) => {
    if (!row?._id) return;
    try {
      setBusyId(String(row._id));
      const res = await adminAPI.staff.unblock(row._id);
      const updated = res.data?.data || res.data;
      setStaff((prev) => (prev || []).map((s) => (String(s._id) === String(row._id) ? updated : s)));
      toast.success('Staff unblocked');
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to unblock staff'));
    } finally {
      setBusyId(null);
    }
  };

  const doRemove = async () => {
    if (!removeRow?._id) return;
    try {
      setBusyId(String(removeRow._id));
      await adminAPI.staff.remove(removeRow._id);
      setStaff((prev) => (prev || []).filter((s) => String(s._id) !== String(removeRow._id)));
      toast.success('Staff removed');
      setRemoveRow(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to remove staff'));
    } finally {
      setBusyId(null);
    }
  };

  const approveProduct = async (row) => {
    if (!row?._id) return;
    try {
      await adminAPI.products.approve(row._id);
      toast.success('Product approved and published');
      setPending((p) => (p || []).filter((x) => String(x._id) !== String(row._id)));
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to approve product'));
    }
  };

  const rejectProduct = async () => {
    if (!rejectTarget?._id) return;
    try {
      await adminAPI.products.reject(rejectTarget._id, { reason: rejectReason });
      toast.success('Product rejected');
      setPending((p) => (p || []).filter((x) => String(x._id) !== String(rejectTarget._id)));
      setRejectTarget(null);
      setRejectReason('');
    } catch (e) {
      toast.error(apiMessage(e, 'Failed to reject product'));
    }
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Team & Access Control</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>
            Manage staff members, assign permissions, and create/manage administrator accounts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'staff' && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} aria-hidden /> Add Staff Member
            </button>
          )}
          {activeTab === 'admins' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAddAdminOpen(true)}
              style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
            >
              <Plus size={16} aria-hidden /> Add New Admin
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: activeTab === 'staff' ? '#1e1b4b' : 'transparent',
            color: activeTab === 'staff' ? '#ffffff' : '#64748b'
          }}
        >
          Staff Members ({staff.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: activeTab === 'admins' ? '#7c3aed' : 'transparent',
            color: activeTab === 'admins' ? '#ffffff' : '#64748b'
          }}
        >
          Administrators ({admins.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            background: activeTab === 'pending' ? '#e11d48' : 'transparent',
            color: activeTab === 'pending' ? '#ffffff' : '#64748b'
          }}
        >
          Product Approvals ({pending.length})
        </button>
      </div>

      {/* ADMINS VIEW */}
      {activeTab === 'admins' && (
        <div className="admin-table-wrap" style={{ marginTop: 16 }}>
          {adminsLoading ? (
            <div style={{ padding: 18 }}>
              <LoadingSpinner />
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Admin Name & Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th style={{ width: 140 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table__empty">
                      No admin accounts found.
                    </td>
                  </tr>
                ) : (
                  admins.map((adm) => (
                    <tr key={adm._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e1b4b' }}>{adm.name || 'Admin User'}</div>
                        <div className="text-muted" style={{ fontSize: 13 }}>{adm.email}</div>
                      </td>
                      <td>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: 9999, fontWeight: 700, fontSize: '0.78rem' }}>
                          Administrator
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>Active</span>
                      </td>
                      <td>{formatDate(adm.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => handleDeleteAdmin(adm)}
                          title="Remove Admin"
                        >
                          <Trash2 size={14} aria-hidden /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* STAFF VIEW */}
      {activeTab === 'staff' && (

      <div className="admin-table-wrap" style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ padding: 18 }}>
            <LoadingSpinner />
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name + Email</th>
                <th>Permissions</th>
                <th>Status</th>
                <th>Last login</th>
                <th style={{ width: 320 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No staff members yet.
                  </td>
                </tr>
              ) : (
                staff.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{row.name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 13 }}>
                        {row.email || '—'}
                      </div>
                    </td>
                    <td>{permBadges(row.permissions)}</td>
                    <td>{statusBadge(row.status)}</td>
                    <td>{formatDate(row.lastLogin)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>
                          <Shield size={14} aria-hidden /> Edit Permissions
                        </button>
                        {row.status === 'blocked' ? (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => doUnblock(row)}>
                            <CheckCircle2 size={14} aria-hidden /> Unblock
                          </button>
                        ) : (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setBlockRow(row)}>
                            <Ban size={14} aria-hidden /> Block
                          </button>
                        )}
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setRemoveRow(row)}>
                          <Trash2 size={14} aria-hidden /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Pending approvals */}
      {activeTab === 'pending' && (
      <section style={{ marginTop: 28 }}>
        <h2 style={{ margin: '0 0 8px' }}>Pending Product Approvals</h2>
        <p className="text-muted" style={{ marginTop: 0 }}>
          Products submitted by staff that require admin approval.
        </p>

        <div className="admin-table-wrap" style={{ marginTop: 12 }}>
          {pendingLoading ? (
            <div style={{ padding: 18 }}>
              <LoadingSpinner />
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Submitted by</th>
                  <th>Date</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="admin-table__empty">
                      No pending approvals.
                    </td>
                  </tr>
                ) : (
                  pending.map((p) => {
                    const img = p.imageUrl || '';
                    const who =
                      p.submittedByStaff && typeof p.submittedByStaff === 'object'
                        ? p.submittedByStaff.name || p.submittedByStaff.email
                        : '—';
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="admin-product-cell">
                            <div className="admin-product-cell__img" aria-hidden>
                              {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '—'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{p.name}</div>
                              <div className="text-muted" style={{ fontSize: 13 }}>
                                {p.slug ? buildProductPath(p.slug, getProductCategorySlug(p)) : '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{who || '—'}</td>
                        <td>{formatDate(p.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => approveProduct(p)}>
                              <CheckCircle2 size={14} aria-hidden /> Approve
                            </button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectTarget(p)}>
                              <XCircle size={14} aria-hidden /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
      )}

      {/* Add Admin Modal */}
      {addAdminOpen && (
        <Modal
          isOpen={addAdminOpen}
          onClose={() => setAddAdminOpen(false)}
          title="Add New Administrator"
        >
          <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
              Create an administrator account with full privileges across orders, products, banners, and settings.
            </p>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Admin Full Name *
              </label>
              <input
                type="text"
                required
                className={formFieldClass}
                placeholder="e.g. Asad Khan"
                value={addAdminName}
                onChange={(e) => setAddAdminName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Admin Email Address *
              </label>
              <input
                type="email"
                required
                className={formFieldClass}
                placeholder="admin@bazaar-pk.com"
                value={addAdminEmail}
                onChange={(e) => setAddAdminEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Password (min 6 characters) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                className={formFieldClass}
                placeholder="••••••••"
                value={addAdminPassword}
                onChange={(e) => setAddAdminPassword(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setAddAdminOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adminSaving}
                className="btn btn-primary"
                style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
              >
                {adminSaving ? 'Creating...' : 'Create Admin Account'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add staff modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Staff Member"
        confirmLabel={createdCreds ? 'Done' : 'Create Staff Member'}
        onConfirm={() => {
          if (createdCreds) setAddOpen(false);
          else createStaff();
        }}
      >
        {createdCreds ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ margin: 0, fontWeight: 700 }}>Share these credentials with the staff member</p>
            <div className="admin-card" style={{ padding: 12 }}>
              <div><strong>Email:</strong> {createdCreds.email}</div>
              <div><strong>Password:</strong> {createdCreds.password}</div>
              <div><strong>Login URL:</strong> {loginUrl}</div>
            </div>
            <button type="button" className="btn btn-outline" onClick={copyAll}>
              <Copy size={16} aria-hidden /> Copy All
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <label>
              <div style={{ fontWeight: 650, marginBottom: 6 }}>Name</div>
              <input className={formFieldClass} value={addName} onChange={(e) => setAddName(e.target.value)} />
            </label>
            <label>
              <div style={{ fontWeight: 650, marginBottom: 6 }}>Email</div>
              <input className={formFieldClass} value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
            </label>
            <label>
              <div style={{ fontWeight: 650, marginBottom: 6 }}>Password</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className={formFieldClass}
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  type="text"
                />
                <button type="button" className="btn btn-outline" onClick={() => setAddPassword(randomPassword())}>
                  Generate
                </button>
              </div>
            </label>

            <div style={{ marginTop: 6, fontWeight: 700 }}>Permissions</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {PERM_SPECS.map((p) => (
                <div key={p.key} style={{ display: 'grid', gap: 6 }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(addPerms?.[p.key])}
                      onChange={() => togglePerm(setAddPerms)(p.key)}
                      style={{ marginTop: 4 }}
                    />
                    <div>
                      <div style={{ fontWeight: 650 }}>{p.label}</div>
                      {p.note ? <div className="text-muted" style={{ fontSize: 13 }}>{p.note}</div> : null}
                    </div>
                  </label>

                  {p.key === 'manageOrders' && Boolean(addPerms?.manageOrders) && (
                    <div style={{ marginLeft: 26, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', display: 'grid', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Orders Scope:</div>
                      <div
                        onClick={() => setAddPerms(prev => ({ ...prev, orderScope: 'all' }))}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          id="add-order-scope-all"
                          name="addOrderScope"
                          value="all"
                          checked={addPerms?.orderScope !== 'own_products'}
                          onChange={() => setAddPerms(prev => ({ ...prev, orderScope: 'all' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="add-order-scope-all" style={{ cursor: 'pointer', margin: 0 }}>
                          All Orders (Store ke tamam orders dekhein)
                        </label>
                      </div>
                      <div
                        onClick={() => setAddPerms(prev => ({ ...prev, orderScope: 'own_products' }))}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          id="add-order-scope-own"
                          name="addOrderScope"
                          value="own_products"
                          checked={addPerms?.orderScope === 'own_products'}
                          onChange={() => setAddPerms(prev => ({ ...prev, orderScope: 'own_products' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="add-order-scope-own" style={{ cursor: 'pointer', margin: 0 }}>
                          Only Their Products (Sirf apne add kiye hue products/categories ke orders)
                        </label>
                      </div>
                    </div>
                  )}

                  {p.key === 'manageCustomers' && Boolean(addPerms?.manageCustomers) && (
                    <div style={{ marginLeft: 26, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', display: 'grid', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Customers Scope:</div>
                      <div
                        onClick={() => setAddPerms(prev => ({ ...prev, customerScope: 'all' }))}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          id="add-cust-scope-all"
                          name="addCustomerScope"
                          value="all"
                          checked={addPerms?.customerScope !== 'own_orders'}
                          onChange={() => setAddPerms(prev => ({ ...prev, customerScope: 'all' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="add-cust-scope-all" style={{ cursor: 'pointer', margin: 0 }}>
                          All Customers (Store ke tamam customers dekhein)
                        </label>
                      </div>
                      <div
                        onClick={() => setAddPerms(prev => ({ ...prev, customerScope: 'own_orders' }))}
                        style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                      >
                        <input
                          type="radio"
                          id="add-cust-scope-own"
                          name="addCustomerScope"
                          value="own_orders"
                          checked={addPerms?.customerScope === 'own_orders'}
                          onChange={() => setAddPerms(prev => ({ ...prev, customerScope: 'own_orders' }))}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="add-cust-scope-own" style={{ cursor: 'pointer', margin: 0 }}>
                          Only Their Product Customers (Sirf unhi orders ke customers jo is staff ki products ke hon)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit permissions */}
      <Modal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Permissions"
        confirmLabel={busyId ? 'Saving…' : 'Save Changes'}
        onConfirm={saveEdit}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {PERM_SPECS.map((p) => (
            <div key={p.key} style={{ display: 'grid', gap: 6 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={Boolean(editPerms?.[p.key])}
                  onChange={() => togglePerm(setEditPerms)(p.key)}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div style={{ fontWeight: 650 }}>{p.label}</div>
                  {p.note ? <div className="text-muted" style={{ fontSize: 13 }}>{p.note}</div> : null}
                </div>
              </label>

              {p.key === 'manageOrders' && Boolean(editPerms?.manageOrders) && (
                <div style={{ marginLeft: 26, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Orders Scope:</div>
                  <div
                    onClick={() => setEditPerms(prev => ({ ...prev, orderScope: 'all' }))}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      id="edit-order-scope-all"
                      name="editOrderScope"
                      value="all"
                      checked={editPerms?.orderScope !== 'own_products'}
                      onChange={() => setEditPerms(prev => ({ ...prev, orderScope: 'all' }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="edit-order-scope-all" style={{ cursor: 'pointer', margin: 0 }}>
                      All Orders (Store ke tamam orders dekhein)
                    </label>
                  </div>
                  <div
                    onClick={() => setEditPerms(prev => ({ ...prev, orderScope: 'own_products' }))}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      id="edit-order-scope-own"
                      name="editOrderScope"
                      value="own_products"
                      checked={editPerms?.orderScope === 'own_products'}
                      onChange={() => setEditPerms(prev => ({ ...prev, orderScope: 'own_products' }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="edit-order-scope-own" style={{ cursor: 'pointer', margin: 0 }}>
                      Only Their Products (Sirf apne add kiye hue products/categories ke orders)
                    </label>
                  </div>
                </div>
              )}

              {p.key === 'manageCustomers' && Boolean(editPerms?.manageCustomers) && (
                <div style={{ marginLeft: 26, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #cbd5e1', display: 'grid', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Customers Scope:</div>
                  <div
                    onClick={() => setEditPerms(prev => ({ ...prev, customerScope: 'all' }))}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      id="edit-cust-scope-all"
                      name="editCustomerScope"
                      value="all"
                      checked={editPerms?.customerScope !== 'own_orders'}
                      onChange={() => setEditPerms(prev => ({ ...prev, customerScope: 'all' }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="edit-cust-scope-all" style={{ cursor: 'pointer', margin: 0 }}>
                      All Customers (Store ke tamam customers dekhein)
                    </label>
                  </div>
                  <div
                    onClick={() => setEditPerms(prev => ({ ...prev, customerScope: 'own_orders' }))}
                    style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#334155', cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      id="edit-cust-scope-own"
                      name="editCustomerScope"
                      value="own_orders"
                      checked={editPerms?.customerScope === 'own_orders'}
                      onChange={() => setEditPerms(prev => ({ ...prev, customerScope: 'own_orders' }))}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="edit-cust-scope-own" style={{ cursor: 'pointer', margin: 0 }}>
                      Only Their Product Customers (Sirf unhi orders ke customers jo is staff ki products ke hon)
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Block staff */}
      <Modal
        isOpen={!!blockRow}
        onClose={() => setBlockRow(null)}
        title="Block Staff"
        confirmLabel={busyId ? 'Blocking…' : 'Block Staff'}
        danger
        onConfirm={doBlock}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            ['1h', 'Block for 1 hour'],
            ['24h', 'Block for 24 hours'],
            ['7d', 'Block for 7 days'],
            ['perm', 'Block permanently']
          ].map(([val, label]) => (
            <label key={val} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="radio"
                name="blockChoice"
                value={val}
                checked={blockChoice === val}
                onChange={() => setBlockChoice(val)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </Modal>

      {/* Remove staff */}
      <Modal
        isOpen={!!removeRow}
        onClose={() => setRemoveRow(null)}
        title="Remove Staff Member"
        confirmLabel={busyId ? 'Removing…' : 'Remove'}
        danger
        onConfirm={doRemove}
      >
        <p style={{ marginTop: 0 }}>
          Remove <strong>{removeRow?.name || removeRow?.email || 'this staff member'}</strong>? They will lose access immediately.
        </p>
      </Modal>

      {/* Reject product */}
      <Modal
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title="Reject Product"
        confirmLabel="Reject"
        danger
        onConfirm={rejectProduct}
      >
        <p style={{ marginTop: 0 }}>
          Provide a reason — it will be shown to the staff member.
        </p>
        <textarea
          className={formFieldClass}
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason…"
        />
      </Modal>
    </div>
  );
}

