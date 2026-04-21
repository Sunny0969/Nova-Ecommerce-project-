import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/axios';
import { apiMessage } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPKR } from '../../utils/currency';

const inputClass =
  'w-full max-w-xs rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900';

export default function AdminStoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    freeShippingMin: 50,
    shippingStandard: 4.99,
    shippingExpress: 5.99,
    shippingNextDay: 9.99,
    taxPercent: 0
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: body } = await adminAPI.storeSettings.get();
      const d = body?.data;
      if (d && typeof d === 'object') {
        setForm({
          freeShippingMin: Number(d.freeShippingMin) || 0,
          shippingStandard: Number(d.shippingStandard) || 0,
          shippingExpress: Number(d.shippingExpress) || 0,
          shippingNextDay: Number(d.shippingNextDay) || 0,
          taxPercent: Math.round((Number(d.taxRate) || 0) * 10000) / 100
        });
      }
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
    const v = e.target.value;
    setForm((f) => ({ ...f, [key]: v === '' ? '' : Number(v) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const taxRate = Math.min(100, Math.max(0, Number(form.taxPercent) || 0)) / 100;
      const { data: body } = await adminAPI.storeSettings.update({
        freeShippingMin: Number(form.freeShippingMin),
        shippingStandard: Number(form.shippingStandard),
        shippingExpress: Number(form.shippingExpress),
        shippingNextDay: Number(form.shippingNextDay),
        taxRate
      });
      const d = body?.data;
      if (d && typeof d === 'object') {
        setForm((f) => ({
          ...f,
          freeShippingMin: Number(d.freeShippingMin),
          shippingStandard: Number(d.shippingStandard),
          shippingExpress: Number(d.shippingExpress),
          shippingNextDay: Number(d.shippingNextDay),
          taxPercent: Math.round((Number(d.taxRate) || 0) * 10000) / 100
        }));
      }
      toast.success(body?.message || 'Settings saved');
    } catch (err) {
      toast.error(apiMessage(err, 'Save failed'));
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

  return (
    <div className="admin-dashboard max-w-3xl">
      <h1 className="admin-dashboard__title">Shipping &amp; tax</h1>
      <p className="admin-dashboard__lede mb-6">
        These values apply to every customer cart and checkout. Free shipping uses the order subtotal{' '}
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
            className={inputClass}
            value={form.freeShippingMin}
            onChange={onChange('freeShippingMin')}
          />
          <p className="mt-1 text-xs text-neutral-500">Example: {formatPKR(form.freeShippingMin)} — standard delivery is free at or above this.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipStd">
              Standard shipping
            </label>
            <input id="shipStd" type="number" min={0} step={0.01} className={inputClass} value={form.shippingStandard} onChange={onChange('shippingStandard')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipExp">
              Express shipping
            </label>
            <input id="shipExp" type="number" min={0} step={0.01} className={inputClass} value={form.shippingExpress} onChange={onChange('shippingExpress')} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800" htmlFor="shipNd">
              Next-day shipping
            </label>
            <input id="shipNd" type="number" min={0} step={0.01} className={inputClass} value={form.shippingNextDay} onChange={onChange('shippingNextDay')} />
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
            className={inputClass}
            value={form.taxPercent}
            onChange={onChange('taxPercent')}
          />
          <p className="mt-1 text-xs text-neutral-500">Applied to merchandise total after coupon discounts. Use 0 for no tax line.</p>
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
