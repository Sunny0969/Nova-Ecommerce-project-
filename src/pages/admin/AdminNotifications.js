import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatCard } from './adminMetricsUI';

const LIMIT = 20;

const CHOICE_FILTERS = [
  { id: 'all', label: 'All responses' },
  { id: 'allowed', label: 'Allowed' },
  { id: 'dismissed', label: 'Not now' },
  { id: 'denied', label: 'Blocked' }
];

function formatDateTime(iso) {
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

function choiceBadge(choice) {
  const c = String(choice || '').toLowerCase();
  if (c === 'allowed') {
    return (
      <span className="admin-status-badge admin-status-badge--delivered">
        <BellRing size={14} aria-hidden /> Allowed
      </span>
    );
  }
  if (c === 'denied') {
    return (
      <span className="admin-status-badge admin-status-badge--cancelled">
        <BellOff size={14} aria-hidden /> Blocked
      </span>
    );
  }
  return (
    <span className="admin-status-badge admin-status-badge--pending">
      <BellOff size={14} aria-hidden /> Not now
    </span>
  );
}

export default function AdminNotifications() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [tab, setTab] = useState('responses');
  const [choice, setChoice] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, choice, tab]);

  const loadStats = useCallback(async () => {
    try {
      const res = await adminAPI.notifications.stats();
      setStats(res.data?.data || null);
    } catch {
      setStats(null);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'responses') {
        const params = { page, limit: LIMIT };
        if (choice !== 'all') params.choice = choice;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const res = await adminAPI.notifications.promptLogs(params);
        const d = res.data?.data;
        setLogs(Array.isArray(d?.logs) ? d.logs : []);
        setTotalPages(Number(d?.totalPages) || 0);
        setTotalCount(Number(d?.totalCount) || 0);
        setSubscribers([]);
      } else {
        const params = { page, limit: LIMIT };
        const res = await adminAPI.notifications.subscribers(params);
        const d = res.data?.data;
        setSubscribers(Array.isArray(d?.subscribers) ? d.subscribers : []);
        setTotalPages(Number(d?.totalPages) || 0);
        setTotalCount(Number(d?.totalCount) || 0);
        setLogs([]);
      }
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load notification data'));
      setLogs([]);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [tab, page, choice, debouncedSearch]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="admin-page admin-notifications">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">
            <Bell size={26} strokeWidth={1.75} aria-hidden />
            Notifications
          </h1>
          <p className="admin-page__subtitle">
            Visitors who allowed or declined the notification prompt (no login required).
          </p>
        </div>
      </header>

      {stats ? (
        <div className="admin-metrics-grid admin-notifications__stats">
          <StatCard title="Allowed (total)" value={stats.allowed ?? 0} icon={BellRing} percentChange={null} />
          <StatCard title="Not now (total)" value={stats.dismissed ?? 0} icon={BellOff} percentChange={null} />
          <StatCard title="Blocked by browser" value={stats.denied ?? 0} icon={BellOff} percentChange={null} />
          <StatCard
            title="Active subscribers"
            value={stats.activeSubscriptions ?? 0}
            icon={Bell}
            percentChange={null}
          />
          <StatCard
            title="Guest subscribers"
            value={stats.guestSubscriptions ?? 0}
            icon={Bell}
            percentChange={null}
          />
          <StatCard
            title="Allowed today"
            value={stats.todayAllowed ?? 0}
            icon={BellRing}
            percentChange={null}
          />
        </div>
      ) : null}

      <div className="admin-toolbar admin-notifications__toolbar">
        <div className="admin-notifications__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'responses'}
            className={`admin-notifications__tab ${tab === 'responses' ? 'admin-notifications__tab--active' : ''}`}
            onClick={() => setTab('responses')}
          >
            Prompt responses
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'subscribers'}
            className={`admin-notifications__tab ${tab === 'subscribers' ? 'admin-notifications__tab--active' : ''}`}
            onClick={() => setTab('subscribers')}
          >
            Active subscribers
          </button>
        </div>

        {tab === 'responses' ? (
          <div className="admin-toolbar__row">
            <div className="admin-search-wrap">
              <Search size={18} aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Search guest ID, IP, page…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search notification responses"
              />
            </div>
            <select
              className="admin-select"
              value={choice}
              onChange={(e) => setChoice(e.target.value)}
              aria-label="Filter by choice"
            >
              {CHOICE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading…" />
      ) : tab === 'responses' ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Choice</th>
                <th>Customer</th>
                <th>Guest ID</th>
                <th>IP</th>
                <th>Device</th>
                <th>Page</th>
                <th>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table__empty">
                    No notification responses yet.
                  </td>
                </tr>
              ) : (
                logs.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDateTime(row.createdAt)}</td>
                    <td>{choiceBadge(row.choice)}</td>
                    <td>
                      {row.user?.email ? (
                        <span>
                          {row.user.name || '—'}
                          <br />
                          <span className="text-muted">{row.user.email}</span>
                        </span>
                      ) : (
                        <span className="text-muted">Guest</span>
                      )}
                    </td>
                    <td>
                      <code className="admin-code-short">{row.guestKey || '—'}</code>
                    </td>
                    <td>{row.clientIp || '—'}</td>
                    <td>{row.device || '—'}</td>
                    <td>{row.pageUrl || '—'}</td>
                    <td>{row.subscribed ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Updated</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Guest ID</th>
                <th>IP</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    No active push subscribers.
                  </td>
                </tr>
              ) : (
                subscribers.map((row) => (
                  <tr key={row._id}>
                    <td>{formatDateTime(row.updatedAt)}</td>
                    <td>{row.isGuest ? 'Guest' : 'Logged in'}</td>
                    <td>
                      {row.user?.email ? (
                        <span>
                          {row.user.name || '—'}
                          <br />
                          <span className="text-muted">{row.user.email}</span>
                        </span>
                      ) : (
                        <span className="text-muted">Guest</span>
                      )}
                    </td>
                    <td>
                      <code className="admin-code-short">{row.guestKey || '—'}</code>
                    </td>
                    <td>{row.clientIp || '—'}</td>
                    <td>{row.device || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <span className="admin-pagination__info">
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
