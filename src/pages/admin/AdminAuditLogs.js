import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, RefreshCw, Clock, User, FileText } from 'lucide-react';
import { adminAPI } from '../../api/adminApi';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ACTION_COLORS = {
  UPDATE_ORDER_STATUS: 'bg-blue-100 text-blue-800 border-blue-200',
  UPDATE_PRODUCT_STOCK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UPDATE_PRODUCT_PRICE: 'bg-amber-100 text-amber-800 border-amber-200',
  CREATE_PRODUCT: 'bg-purple-100 text-purple-800 border-purple-200',
  DEFAULT: 'bg-neutral-100 text-neutral-800 border-neutral-200'
};

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('');
  const [actorRole, setActorRole] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (targetType) params.targetType = targetType;
      if (actorRole) params.actorRole = actorRole;

      const res = await adminAPI.auditLogs.list(params);
      const d = res.data?.data || {};
      setLogs(Array.isArray(d.logs) ? d.logs : []);
      setTotalPages(d.totalPages || 1);
      setTotalCount(d.totalCount || 0);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load audit logs'));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, targetType, actorRole]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="admin-audit-logs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            Activity & Audit Logs
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track staff changes, stock alterations, and order status updates in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          disabled={loading}
          className="btn btn-outline btn-sm inline-flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by staff name, email, or order..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[220px] rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
        />

        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="">All Types</option>
          <option value="order">Orders</option>
          <option value="product">Products</option>
          <option value="category">Categories</option>
        </select>

        <select
          value={actorRole}
          onChange={(e) => {
            setActorRole(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
        >
          <option value="">All Roles</option>
          <option value="staff">Staff Only</option>
          <option value="admin">Admin Only</option>
        </select>
      </div>

      {/* Table list */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner label="Loading audit history..." />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <FileText className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
            <p className="font-medium">No activity logs recorded yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Actions performed by staff and admin will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Staff / Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => {
                  const badgeClass = ACTION_COLORS[log.action] || ACTION_COLORS.DEFAULT;
                  return (
                    <tr key={log._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-neutral-500 flex items-center gap-1.5 pt-4">
                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-neutral-400" />
                          {log.actorName}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {log.actorEmail} ({log.actorRole})
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{log.targetTitle || log.targetType}</div>
                        {log.targetId && (
                          <div className="text-xs text-neutral-400 font-mono">
                            ID: {String(log.targetId).slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-medium text-neutral-700">
                        {log.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
            <div>Total: {totalCount} actions recorded</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-outline btn-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="px-2 py-1 text-xs font-medium">Page {page} of {totalPages}</span>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

