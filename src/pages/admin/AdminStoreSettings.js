import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from 'api';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';
import {
  emptyStoreSettingsForm,
  formToStoreSettingsPayload,
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

  const weightThreshold = Number(form.weightShippingThresholdKg) || 1;
  const shipUpTo = Number(form.shippingUpToThresholdKg) || 0;
  const shipExtra = Number(form.shippingAdditionalPerKgOver) || 0;
  const exampleOver = shipUpTo + shipExtra;

  return (
    <div className="admin-dashboard max-w-3xl">
      <h1 className="admin-dashboard__title">Shipping &amp; tax</h1>
      <p className="admin-dashboard__lede mb-6">
        These values apply to every customer cart and checkout in real time. Free shipping uses the order subtotal{' '}
        <strong>before</strong> discounts. Tax is calculated on the subtotal <strong>after</strong> discounts (not on
        shipping).
      </p>

      <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
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
          <p className="mt-1 text-xs text-neutral-500">
            Standard delivery is free when the cart subtotal (before discounts) reaches this amount. Express and
            next-day always use their flat rates below.
          </p>
        </div>

        <fieldset className="space-y-4 rounded-lg border border-neutral-200 p-4">
          <legend className="px-1 text-sm font-semibold text-neutral-900">Weight-based shipping (standard delivery)</legend>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={Boolean(form.weightShippingEnabled)}
              onChange={onToggle('weightShippingEnabled')}
            />
            Use cart weight for standard shipping (recommended)
          </label>
          <p className="text-xs text-neutral-500">
            Each product needs a weight (kg) in the admin product form. Products without weight use the default below.
            Total cart weight = sum of (product weight × quantity).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="weightThreshold">
                Weight threshold (kg)
              </label>
              <input
                id="weightThreshold"
                type="number"
                min={0.01}
                step={0.01}
                required
                className={inputClass}
                value={form.weightShippingThresholdKg}
                onChange={onChange('weightShippingThresholdKg')}
              />
            </div>
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
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipUpTo">
                Shipping up to threshold (PKR)
              </label>
              <input
                id="shipUpTo"
                type="number"
                min={0}
                step={1}
                required
                className={inputClass}
                value={form.shippingUpToThresholdKg}
                onChange={onChange('shipUpToThresholdKg')}
              />
              <p className="mt-1 text-xs text-neutral-500">
                e.g. {formatPKR(shipUpTo)} when total weight is {weightThreshold} kg or less
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipExtra">
                Additional per kg over threshold (PKR)
              </label>
              <input
                id="shipExtra"
                type="number"
                min={0}
                step={1}
                required
                className={inputClass}
                value={form.shippingAdditionalPerKgOver}
                onChange={onChange('shippingAdditionalPerKgOver')}
              />
              <p className="mt-1 text-xs text-neutral-500">
                e.g. over {weightThreshold} kg → {formatPKR(shipUpTo)} + {formatPKR(shipExtra)} per extra kg started (
                {formatPKR(exampleOver)} for {weightThreshold + 0.1} kg)
              </p>
            </div>
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
            <p className="mt-1 text-xs text-neutral-500">Used only when weight-based shipping is off.</p>
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
          <p className="mt-1 text-xs text-neutral-500">
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
