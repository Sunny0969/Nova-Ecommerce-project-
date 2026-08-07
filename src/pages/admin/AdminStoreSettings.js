import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/adminApi';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';
import {
  emptyStoreSettingsForm,
  formToStoreSettingsPayload,
  newWeightTierRow,
  storeSettingsToForm
} from '../../lib/storeSettingsForm';

const inputClass =
  'w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

export default function AdminStoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyStoreSettingsForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: body } = await adminAPI.storeSettings.get();
      setForm(storeSettingsToForm(body?.data));
    } catch (e) {
      toast.error(apiMessage(e, 'Could not load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const onToggle = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.checked }));
  };

  const updateTier = (id, field, value) => {
    setForm((f) => ({
      ...f,
      weightShippingTiers: (f.weightShippingTiers || []).map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    }));
  };

  const addTier = () => {
    setForm((f) => ({
      ...f,
      weightShippingTiers: [...(f.weightShippingTiers || []), newWeightTierRow()]
    }));
  };

  const removeTier = (id) => {
    setForm((f) => ({
      ...f,
      weightShippingTiers: (f.weightShippingTiers || []).filter((row) => row.id !== id)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = formToStoreSettingsPayload(form);
      const { data: body } = await adminAPI.storeSettings.update(payload);
      setForm(storeSettingsToForm(body?.data));
      toast.success(body?.message || 'Settings saved — customer cart & checkout update within seconds');
    } catch (err) {
      const msg = err.message && !err.response ? err.message : apiMessage(err, 'Save failed');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <LoadingSpinner size="lg" label="Loading settings" />
      </div>
    );
  }

  const weightTiers = form.weightShippingTiers || [];

  return (
    <div className="admin-dashboard admin-store-settings max-w-3xl">
      <h1 className="admin-dashboard__title">Shipping &amp; tax</h1>
      <p className="admin-dashboard__lede mb-6">
        These values apply to every customer cart and checkout in real time. Free shipping uses the order subtotal{' '}
        <strong>before</strong> discounts. Tax is calculated on the subtotal <strong>after</strong> discounts (not on
        shipping).
      </p>

      <form onSubmit={onSubmit} className="admin-store-settings__form space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="freeMin">
            Free shipping from (subtotal)
          </label>
          <input
            id="freeMin"
            type="number"
            min={0}
            step={1}
            required
            className={inputClass}
            value={form.freeShippingMin}
            onChange={onChange('freeShippingMin')}
          />
          <p className="admin-store-settings__hint mt-1 text-xs">
            Standard delivery is free when the cart subtotal (before discounts) reaches this amount.
            Carts with missing product weights always use flat standard shipping (fallback).
          </p>
        </div>

        <fieldset className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <legend className="px-1 text-sm font-semibold text-neutral-900">
            Weight-based shipping (standard delivery)
          </legend>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={Boolean(form.weightShippingEnabled)}
              onChange={onToggle('weightShippingEnabled')}
            />
            Use cart weight for standard shipping (recommended)
          </label>
          <p className="admin-store-settings__hint text-xs">
            Set a flat shipping price for each weight range (kg). Total cart weight uses each product&apos;s
            weight, or the default below when a product has no weight. Customers see cart weight and the matching
            tier at checkout.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="defaultWeight">
              Default product weight (kg)
            </label>
            <input
              id="defaultWeight"
              type="number"
              min={0.01}
              step={0.01}
              required
              className={inputClass}
              value={form.defaultProductWeightKg}
              onChange={onChange('defaultProductWeightKg')}
            />
            <p className="admin-store-settings__hint mt-1 text-xs">
              Used only when estimating weight for products that have no weight set.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-neutral-800">Weight ranges &amp; prices</p>
              <button
                type="button"
                className="btn btn-outline btn-sm admin-store-settings__add-btn"
                onClick={addTier}
              >
                <Plus size={16} aria-hidden /> Add range
              </button>
            </div>

            {weightTiers.length === 0 ? (
              <p className="admin-store-settings__hint rounded-lg border border-dashed border-neutral-400 bg-neutral-50 px-3 py-4 text-sm">
                No weight ranges yet. Click &quot;Add range&quot; — e.g. 0–1 kg = Rs 199, 1.01–2 kg = Rs 320.
              </p>
            ) : (
              <div className="space-y-3">
                {weightTiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className="admin-store-settings__tier-card grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                  >
                    <div>
                      <label className="admin-store-settings__tier-label mb-1 block text-xs">From (kg)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        required
                        className={inputClass}
                        value={tier.minKg}
                        onChange={(e) => updateTier(tier.id, 'minKg', e.target.value)}
                        placeholder="0"
                        aria-label={`Tier ${index + 1} from kg`}
                      />
                    </div>
                    <div>
                      <label className="admin-store-settings__tier-label mb-1 block text-xs">To (kg)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        required
                        className={inputClass}
                        value={tier.maxKg}
                        onChange={(e) => updateTier(tier.id, 'maxKg', e.target.value)}
                        placeholder="1"
                        aria-label={`Tier ${index + 1} to kg`}
                      />
                    </div>
                    <div>
                      <label className="admin-store-settings__tier-label mb-1 block text-xs">Price (PKR)</label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        required
                        className={inputClass}
                        value={tier.price}
                        onChange={(e) => updateTier(tier.id, 'price', e.target.value)}
                        placeholder="199"
                        aria-label={`Tier ${index + 1} price`}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm admin-store-settings__remove-btn"
                        onClick={() => removeTier(tier.id)}
                        aria-label={`Remove tier ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="admin-store-settings__tier-summary sm:col-span-4 text-xs">
                      {tier.minKg !== '' && tier.maxKg !== '' && tier.price !== ''
                        ? `${tier.minKg}–${tier.maxKg} kg → ${formatPKR(Number(tier.price) || 0)} standard shipping`
                        : `Tier ${index + 1}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipStd">
              Flat standard shipping (fallback)
            </label>
            <input
              id="shipStd"
              type="number"
              min={0}
              step={1}
              required
              className={inputClass}
              value={form.shippingStandard}
              onChange={onChange('shippingStandard')}
            />
            <p className="admin-store-settings__hint mt-1 text-xs">
              Used when weight-based shipping is off, any cart item has no weight, or no tier matches.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipExp">
              Express shipping (PKR)
            </label>
            <input
              id="shipExp"
              type="number"
              min={0}
              step={1}
              required
              className={inputClass}
              value={form.shippingExpress}
              onChange={onChange('shippingExpress')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipNd">
              Next-day shipping (PKR)
            </label>
            <input
              id="shipNd"
              type="number"
              min={0}
              step={1}
              required
              className={inputClass}
              value={form.shippingNextDay}
              onChange={onChange('shippingNextDay')}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="taxPct">
            Sales tax (%)
          </label>
          <input
            id="taxPct"
            type="number"
            min={0}
            max={100}
            step={0.01}
            required
            className={inputClass}
            value={form.taxPercent}
            onChange={onChange('taxPercent')}
          />
          <p className="admin-store-settings__hint mt-1 text-xs">
            Applied to merchandise total after coupon discounts. Use 0 for no tax line.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          <button type="button" className="btn btn-outline" onClick={load} disabled={saving}>
            Reload
          </button>
        </div>
      </form>
    </div>
  );
}
