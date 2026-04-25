import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from 'api';
import { apiMessage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';

const emptyForm = {
  label: 'Home',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  isDefault: false
};

export default function Addresses() {
  const { checkAuth } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.listAddresses();
      const list = res.data?.data?.addresses;
      setAddresses(Array.isArray(list) ? list : []);
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load addresses'));
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || 'Home',
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      email: addr.email || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || '',
      isDefault: Boolean(addr.isDefault)
    });
    setModalOpen(true);
  };

  const saveAddress = async () => {
    if (!form.street.trim() || !form.city.trim() || !form.zipCode.trim()) {
      toast.error('Street, city, and ZIP/postal code are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await authAPI.updateAddress(editingId, form);
        toast.success('Address updated');
      } else {
        await authAPI.createAddress(form);
        toast.success('Address added');
      }
      setModalOpen(false);
      await load();
      await checkAuth();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not save address'));
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    try {
      await authAPI.setDefaultAddress(id);
      toast.success('Default address updated');
      await load();
      await checkAuth();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not set default'));
    }
  };

  const removeAddress = async () => {
    if (!deleteId) return;
    try {
      await authAPI.deleteAddress(deleteId);
      toast.success('Address removed');
      setDeleteId(null);
      await load();
      await checkAuth();
    } catch (e) {
      toast.error(apiMessage(e, 'Could not delete'));
    }
  };

  const onChange = (field) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
  };

  return (
    <div className="account-page account-addresses">
      <div className="account-section-head">
        <h2 className="account-page__title">Saved addresses</h2>
        <button type="button" className="btn btn-primary btn-sm" onClick={openNew}>
          Add new
        </button>
      </div>

      {loading ? (
        <p className="account-muted">Loading…</p>
      ) : addresses.length === 0 ? (
        <p className="empty-products-hint">
          No saved addresses yet. Add one for faster checkout.
        </p>
      ) : (
        <ul className="account-addresses__grid">
          {addresses.map((a) => (
            <li key={a._id} className="account-address-card card-like">
              {a.isDefault && <span className="account-address-card__badge">Default</span>}
              <div className="account-address-card__label">{a.label || 'Address'}</div>
              <address className="account-address-block">
                {(a.firstName || a.lastName) && (
                  <>
                    {a.firstName} {a.lastName}
                    <br />
                  </>
                )}
                {a.street}
                <br />
                {a.city}
                {a.state ? `, ${a.state}` : ''} {a.zipCode}
                <br />
                {a.country}
              </address>
              <div className="account-address-card__actions">
                {!a.isDefault && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setDefault(a._id)}
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => openEdit(a)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm account-address-card__delete"
                  onClick={() => setDeleteId(a._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? 'Edit address' : 'New address'}
        confirmLabel={saving ? 'Saving…' : 'Save address'}
        onConfirm={() => {
          if (!saving) saveAddress();
        }}
        cancelLabel="Cancel"
      >
        <div className="account-address-form">
          <label className="account-form__label">Label</label>
          <input
            className="account-form__input"
            value={form.label}
            onChange={onChange('label')}
            placeholder="Home, Work…"
          />
          <div className="account-address-form__2col">
            <div>
              <label className="account-form__label">First name</label>
              <input
                className="account-form__input"
                value={form.firstName}
                onChange={onChange('firstName')}
              />
            </div>
            <div>
              <label className="account-form__label">Last name</label>
              <input
                className="account-form__input"
                value={form.lastName}
                onChange={onChange('lastName')}
              />
            </div>
          </div>
          <label className="account-form__label">Email</label>
          <input
            type="email"
            className="account-form__input"
            value={form.email}
            onChange={onChange('email')}
          />
          <label className="account-form__label">Phone</label>
          <input
            className="account-form__input"
            value={form.phone}
            onChange={onChange('phone')}
          />
          <label className="account-form__label">Street</label>
          <input
            className="account-form__input"
            value={form.street}
            onChange={onChange('street')}
          />
          <div className="account-address-form__2col">
            <div>
              <label className="account-form__label">City</label>
              <input
                className="account-form__input"
                value={form.city}
                onChange={onChange('city')}
              />
            </div>
            <div>
              <label className="account-form__label">State / region</label>
              <input
                className="account-form__input"
                value={form.state}
                onChange={onChange('state')}
              />
            </div>
          </div>
          <div className="account-address-form__2col">
            <div>
              <label className="account-form__label">ZIP / postal</label>
              <input
                className="account-form__input"
                value={form.zipCode}
                onChange={onChange('zipCode')}
              />
            </div>
            <div>
              <label className="account-form__label">Country</label>
              <input
                className="account-form__input"
                value={form.country}
                onChange={onChange('country')}
              />
            </div>
          </div>
          <label className="account-form__checkbox">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={onChange('isDefault')}
            />
            <span>Set as default shipping address</span>
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete address?"
        danger
        confirmLabel="Delete"
        onConfirm={removeAddress}
      >
        <p>This address will be removed from your account.</p>
      </Modal>
    </div>
  );
}
