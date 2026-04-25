import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';
import { StatCard } from './adminMetricsUI';

function RiskGauge({ score }) {
  const s = Math.min(100, Math.max(0, Number(score) || 0));
  let tone = 'low';
  if (s >= 71) tone = 'high';
  else if (s >= 31) tone = 'mid';
  return (
    <div className={`admin-fraud-gauge admin-fraud-gauge--${tone}`} title={`Risk score ${s} / 100`}>
      <div className="admin-fraud-gauge__track">
        <div className="admin-fraud-gauge__fill" style={{ width: `${s}%` }} />
      </div>
      <span className="admin-fraud-gauge__num">{s}</span>
    </div>
  );
}

function orderFromLog(log) {
  return log?.orderId && typeof log.orderId === 'object' ? log.orderId : null;
}

export default function AdminFraud() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [blocklist, setBlocklist] = useState([]);
  const [scope, setScope] = useState('open');
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [blType, setBlType] = useState('ip');
  const [blValue, setBlValue] = useState('');
  const [blReason, setBlReason] = useState('');
  const [actingId, setActingId] = useState(null);

  const refreshAll = useCallback(async () => {
    try {
      const [stRes, blRes, lgRes] = await Promise.all([
        adminAPI.fraud.stats(),
        adminAPI.fraud.blocklist({ limit: 100 }),
        adminAPI.fraud.logs({ scope, page, limit: 15 })
      ]);
      setStats(stRes.data?.data || null);
      const bd = blRes.data?.data;
      setBlocklist(Array.isArray(bd?.entries) ? bd.entries : []);
      const ld = lgRes.data?.data;
      setLogs(Array.isArray(ld?.logs) ? ld.logs : []);
      setTotalPages(Number(ld?.totalPages) || 0);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load fraud data'));
    } finally {
      setReady(true);
    }
  }, [scope, page]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setPage(1);
  }, [scope]);

  const onApprove = async (logId) => {
    setActingId(logId);
    try {
      await adminAPI.fraud.approveLog(logId, {});
      toast.success('Order released for processing');
      await refreshAll();
    } catch (e) {
      toast.error(apiMessage(e, 'Approve failed'));
    } finally {
      setActingId(null);
    }
  };

  const onReject = async (logId) => {
    setActingId(logId);
    try {
      await adminAPI.fraud.rejectLog(logId, { reason: 'Rejected after manual fraud review' });
      toast.success('Order rejected and refunded');
      await refreshAll();
    } catch (e) {
      toast.error(apiMessage(e, 'Reject failed'));
    } finally {
      setActingId(null);
    }
  };

  const onAddBlocklist = async (e) => {
    e.preventDefault();
    if (!blValue.trim()) {
      toast.error('Enter a value');
      return;
    }
    try {
      await adminAPI.fraud.addBlocklist({
        type: blType,
        value: blValue.trim(),
        reason: blReason.trim() || 'Manual block'
      });
      toast.success('Added to blocklist');
      setBlValue('');
      setBlReason('');
      await refreshAll();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not add blocklist entry'));
    }
  };

  const onRemoveBlocklist = async (id) => {
    try {
      await adminAPI.fraud.removeBlocklist(id);
      toast.success('Removed');
      await refreshAll();
    } catch (e) {
      toast.error(apiMessage(e, 'Remove failed'));
    }
  };

  return (
    <div className="admin-fraud">
      <div className="admin-orders__head">
        <div>
          <h1 className="admin-dashboard__title">Fraud review</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Flagged checkouts, risk scores, and blocklist. Auto-rejected payments are refunded and logged.
          </p>
        </div>
      </div>

      {!ready ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="admin-fraud__stats">
            <StatCard
              title="Total checks"
              value={stats?.totalChecks ?? 0}
              icon={Shield}
              percentChange={null}
            />
            <StatCard
              title="Open flagged"
              value={stats?.flaggedOpen ?? 0}
              icon={Shield}
              percentChange={null}
            />
            <StatCard
              title="Auto-rejected"
              value={stats?.autoRejected ?? 0}
              icon={Shield}
              percentChange={null}
            />
            <StatCard
              title="Blocked order total"
              value={stats?.blockedOrderTotal ?? 0}
              displayValue={formatPKR(stats?.blockedOrderTotal ?? 0)}
              icon={Shield}
              percentChange={null}
            />
          </div>

          <div className="admin-fraud__toolbar">
        <div className="admin-orders__status-tabs" role="tablist">
          <button
            type="button"
            className={`admin-orders__status-tab${scope === 'open' ? ' is-active' : ''}`}
            onClick={() => setScope('open')}
          >
            Open queue
          </button>
          <button
            type="button"
            className={`admin-orders__status-tab${scope === 'all' ? ' is-active' : ''}`}
            onClick={() => setScope('all')}
          >
            All logs
          </button>
        </div>
          </div>

          <div className="admin-orders__table-wrap">
        <table className="admin-orders__table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Factors</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-orders__empty">
                  No fraud logs in this view.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const order = orderFromLog(log);
                const uid = log.userId?.email || log.userId?.name || '—';
                return (
                  <tr key={log._id}>
                    <td>
                      <RiskGauge score={log.riskScore} />
                    </td>
                    <td>
                      {order?._id ? (
                        <Link to={`/admin/orders`} className="admin-orders__id">
                          …{String(order._id).slice(-8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                      <div className="admin-orders__customer-email">{log.action}</div>
                    </td>
                    <td>
                      <div>{uid}</div>
                    </td>
                    <td>{formatPKR(log.orderTotal)}</td>
                    <td>
                      <ul className="admin-fraud__factors">
                        {(log.riskFactors || []).slice(0, 4).map((f, i) => (
                          <li key={`${f.code}-${i}`}>
                            <strong>{f.code}</strong> (+{f.weight}) {f.detail ? `— ${f.detail}` : ''}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      {log.action === 'flagged' &&
                      log.reviewAction !== 'approved' &&
                      log.reviewAction !== 'rejected' ? (
                        <div className="admin-fraud__actions">
                          <button
                            type="button"
                            className="btn btn-sm admin-products__btn-edit"
                            disabled={actingId === log._id}
                            onClick={() => onApprove(log._id)}
                            title="Approve"
                          >
                            <Check size={16} aria-hidden /> Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm admin-products__btn-del"
                            disabled={actingId === log._id}
                            onClick={() => onReject(log._id)}
                            title="Reject"
                          >
                            <X size={16} aria-hidden /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-orders__customer-email">
                          {log.reviewAction === 'approved' || log.reviewAction === 'rejected'
                            ? `Review: ${log.reviewAction}`
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
          </div>

          {totalPages > 1 ? (
        <div className="admin-orders__pagination">
          <button
            type="button"
            className="btn btn-sm admin-products__page-nav"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="admin-orders__count">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-sm admin-products__page-nav"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
          ) : null}

          <h2 className="admin-dashboard__title admin-fraud__h2">Blocklist</h2>
          <form className="admin-fraud__block-form" onSubmit={onAddBlocklist}>
        <select
          className="admin-orders__search"
          value={blType}
          onChange={(e) => setBlType(e.target.value)}
          aria-label="Block type"
        >
          <option value="ip">IP</option>
          <option value="email">Email</option>
          <option value="card_fingerprint">Card fingerprint</option>
        </select>
        <input
          className="admin-orders__search"
          placeholder="Value"
          value={blValue}
          onChange={(e) => setBlValue(e.target.value)}
        />
        <input
          className="admin-orders__search"
          placeholder="Reason (optional)"
          value={blReason}
          onChange={(e) => setBlReason(e.target.value)}
        />
        <button type="submit" className="btn btn-sm admin-products__btn-edit">
          Add
        </button>
          </form>

          <div className="admin-orders__table-wrap">
        <table className="admin-orders__table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Value</th>
              <th>Reason</th>
              <th>Expires</th>
              <th aria-label="Remove" />
            </tr>
          </thead>
          <tbody>
            {blocklist.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-orders__empty">
                  No blocklist entries.
                </td>
              </tr>
            ) : (
              blocklist.map((row) => (
                <tr key={row._id}>
                  <td>{row.type}</td>
                  <td className="admin-orders__customer-email" style={{ wordBreak: 'break-all' }}>
                    {row.value}
                  </td>
                  <td>{row.reason || '—'}</td>
                  <td>{row.expiresAt ? new Date(row.expiresAt).toLocaleString() : 'Never'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm admin-products__page-nav"
                      onClick={() => onRemoveBlocklist(row._id)}
                      title="Remove"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </>
      )}
    </div>
  );
}
