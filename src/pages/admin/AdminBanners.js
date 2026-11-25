import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { adminAPI } from '../../api/adminApi';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiMessage } from '../../lib/api';

const formFieldClass =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: 'NEW COLLECTION',
    badge: 'Flat 30% Off',
    imageUrl: '',
    link: '/shop',
    buttonText: 'Shop Now',
    displayOrder: 0,
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.banners.list();
      const list = res?.data?.data || res?.data || [];
      setBanners(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to load promotional banners'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      tag: 'NEW COLLECTION',
      badge: 'Flat 30% Off',
      imageUrl: '',
      link: '/shop',
      buttonText: 'Shop Now',
      displayOrder: (banners.length + 1),
      isActive: true
    });
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      tag: banner.tag || 'NEW COLLECTION',
      badge: banner.badge || '',
      imageUrl: banner.imageUrl || '',
      link: banner.link || '/shop',
      buttonText: banner.buttonText || 'Shop Now',
      displayOrder: banner.displayOrder || 0,
      isActive: banner.isActive !== false
    });
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleToggle = async (banner) => {
    try {
      await adminAPI.banners.toggle(banner._id);
      toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to toggle banner status'));
    }
  };

  const handleDelete = async (banner) => {
    if (!window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;
    try {
      await adminAPI.banners.remove(banner._id);
      toast.success('Banner deleted');
      fetchBanners();
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to delete banner'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Banner title is required');
      return;
    }

    if (!selectedFile && !formData.imageUrl.trim()) {
      toast.error('Please provide an image URL or choose an image file');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('subtitle', formData.subtitle.trim());
      data.append('tag', formData.tag.trim());
      data.append('badge', formData.badge.trim());
      data.append('link', formData.link.trim());
      data.append('buttonText', formData.buttonText.trim());
      data.append('displayOrder', String(formData.displayOrder || 0));
      data.append('isActive', String(formData.isActive));

      if (selectedFile) {
        data.append('image', selectedFile);
      } else {
        data.append('imageUrl', formData.imageUrl.trim());
      }

      if (editingBanner) {
        await adminAPI.banners.update(editingBanner._id, data);
        toast.success('Banner updated successfully');
      } else {
        await adminAPI.banners.create(data);
        toast.success('New banner created successfully');
      }

      setModalOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to save banner'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem 2rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={24} style={{ color: '#7c3aed' }} />
            Promotional Banners & Offers
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0.25rem 0 0' }}>
            Manage homepage slider banners, sales badges, and customer offers dynamically without touching code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#7c3aed',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '9999px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
          }}
        >
          <Plus size={18} />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <LoadingSpinner size="lg" />
        </div>
      ) : banners.length === 0 ? (
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1', padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <ImageIcon size={48} style={{ color: '#94a3b8', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>No promotional banners yet</h3>
          <p style={{ maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
            Add your first slider banner to engage shoppers with seasonal offers, discounts, and new arrivals.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              background: '#7c3aed',
              color: '#ffffff',
              padding: '0.6rem 1.25rem',
              borderRadius: '9999px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Create Banner
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {banners.map((b) => (
            <div
              key={b._id}
              style={{
                background: '#ffffff',
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Image Preview & Badges */}
              <div style={{ position: 'relative', height: 200, width: '100%', background: '#f8fafc' }}>
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {b.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(4px)',
                      color: '#7c3aed',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {b.badge}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: b.isActive ? '#10b981' : '#64748b',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: 9999
                  }}
                >
                  {b.isActive ? 'Active on Carousel' : 'Draft / Inactive'}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  {b.tag || 'PROMOTION'} • Order #{b.displayOrder}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 0.4rem', lineHeight: 1.3 }}>
                  {b.title}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1rem', lineHeight: 1.5, flex: 1 }}>
                  {b.subtitle || '—'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Link: <span style={{ color: '#475569', fontWeight: 600 }}>{b.link}</span>
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      title={b.isActive ? 'Deactivate' : 'Activate'}
                      onClick={() => handleToggle(b)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: b.isActive ? '#10b981' : '#94a3b8',
                        padding: 6
                      }}
                    >
                      {b.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </button>
                    <button
                      type="button"
                      title="Edit banner"
                      onClick={() => handleOpenEdit(b)}
                      style={{
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#475569',
                        padding: '6px 8px'
                      }}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      title="Delete banner"
                      onClick={() => handleDelete(b)}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#dc2626',
                        padding: '6px 8px'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingBanner ? 'Edit Banner / Offer' : 'Add New Promotional Banner'}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Banner Headline Title *
              </label>
              <input
                type="text"
                required
                className={formFieldClass}
                placeholder="e.g. Trendy fashion for Every Style"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Subtitle / Description
              </label>
              <textarea
                rows={2}
                className={formFieldClass}
                placeholder="e.g. Discover the latest outfits, accessories and more with fast delivery."
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Eyebrow Tag
                </label>
                <input
                  type="text"
                  className={formFieldClass}
                  placeholder="e.g. NEW COLLECTION / FLASH SALE"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Floating Offer Badge
                </label>
                <input
                  type="text"
                  className={formFieldClass}
                  placeholder="e.g. Flat 30% Off / Up to 50% Off"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                className={formFieldClass}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>Or enter direct image URL:</div>
              <input
                type="url"
                className={formFieldClass}
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Button Action Link
                </label>
                <input
                  type="text"
                  className={formFieldClass}
                  placeholder="/shop or /clothing"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Button Label
                </label>
                <input
                  type="text"
                  className={formFieldClass}
                  placeholder="Shop Now"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  className={formFieldClass}
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.2rem' }}>
                <input
                  type="checkbox"
                  id="banner-is-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#7c3aed' }}
                />
                <label htmlFor="banner-is-active" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>
                  Active on Homepage
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 8,
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#7c3aed',
                  border: 'none',
                  padding: '0.65rem 1.5rem',
                  borderRadius: 8,
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
