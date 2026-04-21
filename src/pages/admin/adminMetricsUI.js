import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function formatMonthPoint(key) {
  if (!key || !/^\d{4}-\d{2}$/.test(key)) return key;
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-GB', {
    month: 'short',
    year: '2-digit'
  });
}

export function formatDayLabel(key) {
  if (!key) return '';
  const d = new Date(key + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function orderShortId(order) {
  if (!order?._id) return '—';
  return String(order._id).slice(-8).toUpperCase();
}

export function statusClass(status) {
  return `admin-dash-badge admin-dash-badge--${status || 'pending'}`;
}

export function Delta({ percentChange }) {
  if (percentChange == null || Number.isNaN(Number(percentChange))) {
    return <span className="admin-stat-card__delta admin-stat-card__delta--neutral">—</span>;
  }
  const n = Number(percentChange);
  const up = n >= 0;
  return (
    <span
      className={`admin-stat-card__delta ${up ? 'admin-stat-card__delta--up' : 'admin-stat-card__delta--down'}`}
    >
      {up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
      {up ? '+' : ''}
      {n.toFixed(1)}%
      <span className="admin-stat-card__delta-hint"> vs prior period</span>
    </span>
  );
}

export function StatCard({ title, value, displayValue, percentChange, icon: Icon }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__top">
        <span className="admin-stat-card__icon" aria-hidden>
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className="admin-stat-card__title">{title}</span>
      </div>
      <div className="admin-stat-card__value">{displayValue != null ? displayValue : value}</div>
      <Delta percentChange={percentChange} />
    </div>
  );
}
