import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { Wallet, ShoppingCart, Package, Users } from 'lucide-react';
import { adminAPI } from '../../api/axios';
import { apiMessage } from '../../lib/api';
import { productImageUrl } from '../../lib/productImage';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR, formatPKRChartTick } from '../../utils/currency';
import {
  formatMonthPoint,
  formatDayLabel,
  orderShortId,
  statusClass,
  StatCard
} from './adminMetricsUI';

const REV_PERIODS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '12 months' }
];

function revenueChartTitle(period) {
  const m = { '7d': 'last 7 days', '30d': 'last 30 days', '6m': 'last 6 months', '1y': 'last 12 months' };
  return `Revenue (${m[period] || period})`;
}

function revenueChartHint(granularity) {
  const g = granularity === 'day' ? 'UTC days' : 'UTC months';
  return `Delivered orders by revenue recognition date (${g}).`;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [revenuePoints, setRevenuePoints] = useState([]);
  const [revGranularity, setRevGranularity] = useState('month');
  const [orderPoints, setOrderPoints] = useState([]);
  const [revPeriod, setRevPeriod] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [sRes, rRes, oRes] = await Promise.all([
          adminAPI.dashboard.stats(),
          adminAPI.dashboard.revenueChart({ period: revPeriod }),
          adminAPI.dashboard.ordersChart()
        ]);
        if (cancelled) return;
        setStats(sRes.data?.data || null);
        const rData = rRes.data?.data;
        setRevenuePoints(Array.isArray(rData?.points) ? rData.points : []);
        setRevGranularity(rData?.granularity === 'day' ? 'day' : 'month');
        setOrderPoints(oRes.data?.data?.points || []);
      } catch (e) {
        if (!cancelled) {
          setError(apiMessage(e, 'Could not load analytics'));
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [revPeriod]);

  const lineData = useMemo(() => {
    const dayAxis = revGranularity === 'day';
    return revenuePoints.map((p) => ({
      ...p,
      shortLabel: dayAxis ? formatDayLabel(p.key) : formatMonthPoint(p.key)
    }));
  }, [revenuePoints, revGranularity]);

  const barData = useMemo(
    () =>
      orderPoints.map((p) => ({
        ...p,
        shortLabel: formatDayLabel(p.key)
      })),
    [orderPoints]
  );

  const topRows = stats?.topProducts || [];
  const recent = stats?.recentOrders || [];
  const lowStock = stats?.lowStockList || [];

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <LoadingSpinner size="lg" label="Loading analytics" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <p className="admin-dashboard__error">{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-analytics">
      <h1 className="admin-dashboard__title">Analytics</h1>
      <p className="admin-dashboard__lede">
        Revenue trends, order volume, and catalog signals from the same dashboard API. Switch the revenue window
        below; the Dashboard home still shows a fixed 6‑month revenue view.
      </p>

      <div className="admin-stat-grid">
        <StatCard
          title="Revenue (delivered, MTD)"
          value={stats?.totalRevenue?.value}
          displayValue={formatPKR(stats?.totalRevenue?.value)}
          percentChange={stats?.totalRevenue?.percentChange}
          icon={Wallet}
        />
        <StatCard
          title="Orders (MTD)"
          value={stats?.ordersMtd?.value}
          displayValue={stats?.ordersMtd?.value}
          percentChange={stats?.ordersMtd?.percentChange}
          icon={ShoppingCart}
        />
        <StatCard
          title="Products (catalog)"
          value={stats?.totalProducts?.value}
          displayValue={stats?.totalProducts?.value}
          percentChange={stats?.totalProducts?.percentChange}
          icon={Package}
        />
        <StatCard
          title="Customers"
          value={stats?.totalCustomers?.value}
          displayValue={stats?.totalCustomers?.value}
          percentChange={stats?.totalCustomers?.percentChange}
          icon={Users}
        />
      </div>

      <div className="admin-charts">
        <div className="admin-chart-card">
          <div className="admin-analytics__chart-head">
            <div>
              <h2 className="admin-chart-card__title">{revenueChartTitle(revPeriod)}</h2>
              <p className="admin-chart-card__hint">{revenueChartHint(revGranularity)}</p>
            </div>
            <div className="admin-analytics__period-tabs" role="tablist" aria-label="Revenue period">
              {REV_PERIODS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={revPeriod === tab.value}
                  className={`admin-analytics__period-tab${revPeriod === tab.value ? ' is-active' : ''}`}
                  onClick={() => setRevPeriod(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-chart-card__plot">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#9ca3af', fontSize: revGranularity === 'day' ? 9 : 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3e' }}
                  interval={revGranularity === 'day' ? 'preserveStartEnd' : 0}
                  minTickGap={revGranularity === 'day' ? 8 : 4}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3e' }}
                  tickFormatter={(v) => formatPKRChartTick(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: 8
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                  formatter={(val) => [formatPKR(val), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#c8a84b"
                  strokeWidth={2}
                  dot={{ fill: '#c8a84b', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-chart-card">
          <h2 className="admin-chart-card__title">Orders (last 30 days)</h2>
          <p className="admin-chart-card__hint">All orders by created date (UTC days).</p>
          <div className="admin-chart-card__plot">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3e' }}
                  interval="preserveStartEnd"
                  minTickGap={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3e' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid #2a2a3e',
                    borderRadius: 8
                  }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="count" fill="#3d4f7c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-dash-tables">
        <section className="admin-dash-section">
          <h2 className="admin-dash-section__title">Recent orders</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table__empty">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recent.map((o) => {
                    const cust = o.user?.name || o.user?.email || '—';
                    return (
                      <tr key={o._id}>
                        <td>
                          <Link to={`/admin/orders/${o._id}`} className="admin-table__link">
                            #{orderShortId(o)}
                          </Link>
                        </td>
                        <td>{cust}</td>
                        <td>{formatPKR(o.totalPrice)}</td>
                        <td>
                          <span className={statusClass(o.status)}>{o.status}</span>
                        </td>
                        <td>
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-dash-section">
          <h2 className="admin-dash-section__title">Top products (30 days)</h2>
          <p className="admin-dash-section__hint">By revenue from non-cancelled orders.</p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="admin-table__empty">
                      No data yet
                    </td>
                  </tr>
                ) : (
                  topRows.map((row, i) => {
                    const p = row.product;
                    const img = p ? productImageUrl(p) : '';
                    const name = p?.name || 'Product';
                    const link = p?.slug ? `/shop/${p.slug}` : null;
                    return (
                      <tr key={p?._id || i}>
                        <td>
                          <div className="admin-product-cell">
                            <div className="admin-product-cell__img">
                              {img ? (
                                <img src={img} alt="" width={56} height={56} loading="lazy" decoding="async" />
                              ) : (
                                <span aria-hidden>·</span>
                              )}
                            </div>
                            <div>
                              {link ? (
                                <a href={link} className="admin-table__link" target="_blank" rel="noreferrer">
                                  {name}
                                </a>
                              ) : (
                                name
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{row.units != null ? row.units : '—'}</td>
                        <td>{formatPKR(row.revenue)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="admin-dash-section admin-low-stock">
        <div className="admin-low-stock__head">
          <h2 className="admin-dash-section__title">Low stock alert</h2>
          <span className="admin-low-stock__badge">Stock &lt; 10</span>
        </div>
        {lowStock.length === 0 ? (
          <p className="admin-dashboard__lede">No products below threshold.</p>
        ) : (
          <ul className="admin-low-stock__list">
            {lowStock.map((p) => (
              <li key={p._id} className="admin-low-stock__row">
                <div className="admin-product-cell">
                  <div className="admin-product-cell__img">
                    {productImageUrl(p) ? (
                      <img
                        src={productImageUrl(p)}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span aria-hidden>·</span>
                    )}
                  </div>
                  <div>
                    <strong>{p.name}</strong>
                    <span className="admin-low-stock__meta">
                      Stock: <b>{p.stock}</b>
                    </span>
                  </div>
                </div>
                <Link to={`/admin/products/${p._id}/edit`} className="btn btn-sm admin-low-stock__btn">
                  Restock
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
