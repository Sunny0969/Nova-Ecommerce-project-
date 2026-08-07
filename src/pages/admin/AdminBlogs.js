import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileEdit, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '—';
  }
}

function statusBadgeClass(status) {
  return status === 'published'
    ? 'admin-dash-badge admin-dash-badge--delivered'
    : 'admin-dash-badge admin-dash-badge--pending';
}

function auditHintClass(value, max) {
  if (value > max) return 'admin-blogs-audit__hint admin-blogs-audit__hint--warn';
  return 'admin-blogs-audit__hint';
}

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingBlog, setEditingBlog] = useState(null);
  const [editedH1, setEditedH1] = useState('');
  const [editedMetaTitle, setEditedMetaTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [savingAudit, setSavingAudit] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { status: filter };
      const res = await adminAPI.blogs.list(params);
      const data = res.data?.data;
      setBlogs(Array.isArray(data?.posts) ? data.posts : []);
    } catch (error) {
      toast.error(apiMessage(error, 'Failed to fetch blogs'));
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const draftCount = useMemo(
    () => blogs.filter((b) => b.status === 'draft').length,
    [blogs]
  );

  const openAuditPanel = (blog) => {
    setEditingBlog(blog);
    setEditedH1(blog.title || '');
    setEditedMetaTitle(
      blog.metaTitle ||
        (blog.title ? `${blog.title} | Bazaar`.slice(0, 120) : '')
    );
    setEditedSummary(blog.metaDescription || blog.description || '');
    setEditedContent(blog.body || '');
  };

  const closeAuditPanel = () => {
    if (savingAudit) return;
    setEditingBlog(null);
  };

  const handleSaveAndAudit = async () => {
    if (!editingBlog || savingAudit) return;
    const id = String(editingBlog._id || editingBlog.id);
    try {
      setSavingAudit(true);
      await adminAPI.blogs.update(id, {
        title: editedH1,
        metaTitle: editedMetaTitle,
        summary: editedSummary,
        content: editedContent
      });
      toast.success('Content audited and saved');
      setEditingBlog(null);
      await fetchBlogs();
    } catch (error) {
      toast.error(apiMessage(error, 'Audit validation failed'));
    } finally {
      setSavingAudit(false);
    }
  };

  const handlePublish = async (id) => {
    if (busyId) return;
    try {
      setBusyId(String(id));
      await adminAPI.blogs.publish(id);
      toast.success('Blog approved and published to the live site');
      await fetchBlogs();
    } catch (error) {
      toast.error(apiMessage(error, 'Approval failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleUnpublish = async (id) => {
    if (busyId) return;
    if (!window.confirm('Move this blog back to draft? It will be hidden from the public site.')) return;
    try {
      setBusyId(String(id));
      await adminAPI.blogs.unpublish(id);
      toast.success('Blog moved to draft');
      await fetchBlogs();
    } catch (error) {
      toast.error(apiMessage(error, 'Could not unpublish'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (busyId) return;
    if (!window.confirm('Delete this blog permanently?')) return;
    try {
      setBusyId(String(id));
      await adminAPI.blogs.delete(id);
      toast.success('Blog deleted');
      if (editingBlog && String(editingBlog._id || editingBlog.id) === String(id)) {
        setEditingBlog(null);
      }
      await fetchBlogs();
    } catch (error) {
      toast.error(apiMessage(error, 'Delete failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      const res = await adminAPI.blogs.generateAi();
      const title = res.data?.data?.post?.title;
      toast.success(title ? `AI draft created: ${title}` : 'New AI SEO blog draft created');
      setFilter('draft');
      await fetchBlogs();
    } catch (error) {
      toast.error(apiMessage(error, 'AI blog generation failed'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="admin-blogs">
      <div className="admin-products__head">
        <div>
          <h1 className="admin-dashboard__title">AI Blog Queue</h1>
          <p className="admin-dashboard__lede" style={{ marginBottom: 0 }}>
            Review SEO-optimized drafts, audit content, then approve to publish on{' '}
            <code className="admin-categories__slug">/blog</code>
            {draftCount > 0 ? ` — ${draftCount} awaiting approval` : ''}.
          </p>
        </div>
        <button
          type="button"
          className="btn admin-products__add"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Sparkles size={18} aria-hidden />
          {generating ? 'Generating…' : 'Generate AI draft'}
        </button>
      </div>

      <div className="admin-blogs__filters" role="tablist" aria-label="Blog status filter">
        {[
          ['all', 'All'],
          ['draft', 'Drafts'],
          ['published', 'Published']
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            className={`admin-blogs__filter${filter === key ? ' admin-blogs__filter--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading blog queue" />
      ) : (
        <div className="admin-table-wrap admin-products__table-wrap">
          <table className="admin-table admin-products__table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Generated</th>
                <th>Status</th>
                <th className="admin-products__th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table__empty">
                    No blogs yet. Use &quot;Generate AI draft&quot; or wait for the nightly AI cron when enabled
                    on Railway.
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => {
                  const id = String(blog._id || blog.id);
                  const isBusy = busyId === id;
                  return (
                    <tr
                      key={id}
                      className="admin-blogs__row"
                      onClick={() => openAuditPanel(blog)}
                    >
                      <td style={{ maxWidth: 320 }}>
                        <div className="admin-blogs__title-cell">
                          <span className="admin-blogs__title admin-blogs__title--link">
                            {blog.title}
                          </span>
                          {blog.slug ? (
                            <span className="admin-blogs__slug">/blog/{blog.slug}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{blog.category || '—'}</td>
                      <td>{formatDate(blog.createdAt || blog.dateISO)}</td>
                      <td>
                        <span className={statusBadgeClass(blog.status)}>
                          {(blog.status || 'draft').toUpperCase()}
                        </span>
                      </td>
                      <td className="admin-products__actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-blogs__audit-btn"
                          disabled={isBusy}
                          onClick={() => openAuditPanel(blog)}
                          title="Content audit & editor"
                        >
                          <FileEdit size={14} aria-hidden />
                          Audit
                        </button>
                        {blog.status === 'draft' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isBusy}
                            onClick={() => handlePublish(id)}
                          >
                            Approve &amp; publish
                          </button>
                        ) : (
                          <>
                            <a
                              href={`/blog/${encodeURIComponent(blog.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm admin-blogs__view-btn"
                            >
                              <ExternalLink size={14} aria-hidden />
                              View live
                            </a>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={isBusy}
                              onClick={() => handleUnpublish(id)}
                              title="Move to draft"
                            >
                              <Undo2 size={14} aria-hidden />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline btn-sm admin-blogs__delete-btn"
                          disabled={isBusy}
                          onClick={() => handleDelete(id)}
                          title="Delete blog"
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingBlog ? (
        <div
          className="admin-blogs-audit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-blogs-audit-title"
        >
          <button
            type="button"
            className="admin-blogs-audit__backdrop"
            aria-label="Close audit panel"
            onClick={closeAuditPanel}
          />
          <aside className="admin-blogs-audit__panel">
            <header className="admin-blogs-audit__head">
              <div>
                <h2 id="admin-blogs-audit-title" className="admin-blogs-audit__title">
                  Content Audit &amp; Editor
                </h2>
                <p className="admin-blogs-audit__subtitle">
                  {editingBlog.slug ? `/blog/${editingBlog.slug}` : 'Draft blog'}
                </p>
              </div>
              <button
                type="button"
                className="admin-blogs-audit__close"
                onClick={closeAuditPanel}
                aria-label="Close"
              >
                <X size={20} aria-hidden />
              </button>
            </header>

            <div className="admin-blogs-audit__body">
              <label className="admin-blogs-audit__field">
                <span className="admin-blogs-audit__label">
                  H1 — Page heading
                  <span className={auditHintClass(editedH1.length, 120)}>
                    {editedH1.length}/120
                  </span>
                </span>
                <input
                  type="text"
                  value={editedH1}
                  onChange={(e) => setEditedH1(e.target.value)}
                  className="admin-blogs-audit__input"
                  maxLength={200}
                  placeholder="Main article heading shown on /blog/…"
                />
              </label>

              <label className="admin-blogs-audit__field">
                <span className="admin-blogs-audit__label">
                  Meta title — browser tab / Google
                  <span className={auditHintClass(editedMetaTitle.length, 60)}>
                    {editedMetaTitle.length}/60
                  </span>
                </span>
                <input
                  type="text"
                  value={editedMetaTitle}
                  onChange={(e) => setEditedMetaTitle(e.target.value)}
                  className="admin-blogs-audit__input"
                  maxLength={120}
                  placeholder="Keyword-rich title | Bazaar"
                />
              </label>

              <label className="admin-blogs-audit__field">
                <span className="admin-blogs-audit__label">
                  Meta description
                  <span className={auditHintClass(editedSummary.length, 155)}>
                    {editedSummary.length}/155
                  </span>
                </span>
                <textarea
                  rows={3}
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="admin-blogs-audit__textarea"
                />
              </label>

              <label className="admin-blogs-audit__field">
                <span className="admin-blogs-audit__label">Article Body (semantic HTML)</span>
                <textarea
                  rows={18}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="admin-blogs-audit__textarea admin-blogs-audit__textarea--mono"
                  spellCheck={false}
                />
              </label>
            </div>

            <footer className="admin-blogs-audit__foot">
              <p className="admin-blogs-audit__note">
                Saving runs automated SEO checks: heading hierarchy, list/table structure, meta limits,
                and EEAT trust signals.
              </p>
              <div className="admin-blogs-audit__actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={closeAuditPanel}
                  disabled={savingAudit}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm admin-blogs-audit__save"
                  onClick={handleSaveAndAudit}
                  disabled={savingAudit}
                >
                  {savingAudit ? 'Validating…' : 'Save & validate'}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
