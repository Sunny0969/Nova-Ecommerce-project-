import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Shield, Trash2, Ban, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { adminAPI } from 'api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiMessage } from '../../lib/api';

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
      {granted.map((g) => (
        <span
          key={g.key}
          className="admin-dash-badge"
          style={{ background: '#1a1a2e', color: '#c8a84b' }}
          title={g.note || g.label}
        >
          {g.label}
        </span>
      ))}
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

  const loadStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.staff.list();
      const list = res.data?.data || res.data;
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
      const list = res.data?.data || res.data;
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
  }, [loadStaff, loadPending]);

  const loginUrl = useMemo(() => `${window.location.origin}/staff-login`, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Staff Access Management</h1>
          <p className="text-muted" style={{ marginTop: 6 }}>
            Create staff accounts with limited permissions.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} aria-hidden /> Add Staff Member
        </button>
      </div>

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

      {/* Pending approvals */}
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
                                {p.slug ? `/shop/${p.slug}` : '—'}
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
                <label key={p.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
            <label key={p.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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

