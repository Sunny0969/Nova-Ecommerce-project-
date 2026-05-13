import React, { useCallback, useEffect, useMemo, useRef, useState, useId } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, GripVertical, X } from 'lucide-react';
import JoditEditor from 'jodit-react';
import 'jodit/es2021/jodit.min.css';
import { adminAPI } from 'api';

/** Preview of public URL path from the product title (matches server slug-from-name rules). */
function seoSlugFromTitle(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'product';
}

const LS_PREFIX = 'nova_shop_admin_product_form_v1_';

/** Soft cap for description HTML (whole MongoDB document must stay under 16MB BSON). */
const RICH_DESC_MAX_TOTAL_CHARS = 14_000_000;

const schema = yup.object({
  name: yup.string().required('Name is required').max(200),
  shortDescription: yup.string().max(500, 'Short description is at most 500 characters'),
  description: yup
    .string()
    .default('')
    .max(
      RICH_DESC_MAX_TOTAL_CHARS,
      'Full description is extremely long. If save still fails, shorten text or use fewer embedded images (MongoDB document size limit).'
    ),
  price: yup
    .number()
    .typeError('Valid price is required')
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  comparePrice: yup
    .number()
    .transform((v, o) => (o === '' || o == null || Number.isNaN(v) ? null : v))
    .nullable()
    .min(0)
    .notRequired(),
  costPrice: yup
    .number()
    .transform((v, o) => (o === '' || o == null || Number.isNaN(v) ? null : v))
    .nullable()
    .min(0)
    .notRequired(),
  sku: yup.string().max(120, 'SKU is too long'),
  stock: yup
    .number()
    .typeError('Valid stock is required')
    .integer('Stock must be a whole number')
    .min(0)
    .required('Stock is required'),
  lowStockThreshold: yup
    .number()
    .transform((v, o) => (o === '' || o == null || Number.isNaN(v) ? null : v))
    .nullable()
    .min(0)
    .integer()
    .notRequired(),
  category: yup.string().required('Category is required'),
  tags: yup.array().of(yup.string().max(60)).default([]),
  isFeatured: yup.boolean().default(false),
  isPublished: yup.boolean().default(false),
  variantGroupKey: yup.string().max(120, 'Too long').default('')
});

const defaultForm = {
  name: '',
  shortDescription: '',
  description: '',
  price: 0,
  comparePrice: null,
  costPrice: null,
  sku: '',
  stock: 0,
  lowStockThreshold: null,
  category: '',
  tags: [],
  isFeatured: false,
  isPublished: false,
  variantGroupKey: ''
};

function newLocalKey() {
  return `L-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const VARIANT_AXIS_KEYS = [
  { key: 'color', label: 'Color' },
  { key: 'shape', label: 'Shape / material' },
  { key: 'size', label: 'Size' }
];

function defaultVariantAxesState() {
  return {
    color: { enabled: false, selectionMode: 'single', options: [] },
    shape: { enabled: false, selectionMode: 'single', options: [] },
    size: { enabled: false, selectionMode: 'single', options: [] }
  };
}

function migrateLegacyToVariantAxes(color, texture, size) {
  const base = defaultVariantAxesState();
  const parts = (s) =>
    String(s || '')
      .split(/[,;|]/g)
      .map((x) => x.trim())
      .filter(Boolean);
  const c = parts(color);
  if (c.length) {
    base.color = {
      enabled: true,
      selectionMode: c.length > 1 ? 'multiple' : 'single',
      options: c.map((label) => ({ label, image: null }))
    };
  }
  const sh = parts(texture);
  if (sh.length) {
    base.shape = {
      enabled: true,
      selectionMode: sh.length > 1 ? 'multiple' : 'single',
      options: sh.map((label) => ({ label, image: null }))
    };
  }
  const sz = parts(size);
  if (sz.length) {
    base.size = {
      enabled: true,
      selectionMode: sz.length > 1 ? 'multiple' : 'single',
      options: sz.map((label) => ({ label, image: null }))
    };
  }
  return base;
}

function normalizeLoadedVariantAxes(apiAxes, legacyColor, legacyTexture, legacySize) {
  if (apiAxes && typeof apiAxes === 'object' && (apiAxes.color || apiAxes.shape || apiAxes.size)) {
    const base = defaultVariantAxesState();
    for (const { key } of VARIANT_AXIS_KEYS) {
      const ax = apiAxes[key];
      if (!ax) continue;
      const options = (ax.options || [])
        .map((o) => ({
          label: String(o.label || ''),
          image:
            o.image?.url && o.image?.public_id
              ? { type: 'server', url: o.image.url, public_id: o.image.public_id }
              : o.image?.url
                ? { type: 'server', url: o.image.url, public_id: o.image.public_id || '' }
                : null
        }))
        .filter((o) => String(o.label || '').trim());
      base[key] = {
        enabled: Boolean(ax.enabled) && options.length > 0,
        selectionMode: ax.selectionMode === 'multiple' ? 'multiple' : 'single',
        options
      };
    }
    const hasAny =
      base.color.enabled ||
      base.shape.enabled ||
      base.size.enabled ||
      base.color.options.length ||
      base.shape.options.length ||
      base.size.options.length;
    if (hasAny) return base;
  }
  return migrateLegacyToVariantAxes(legacyColor, legacyTexture, legacySize);
}

function variantAxesPayloadForApi(va) {
  const axes = {};
  for (const { key } of VARIANT_AXIS_KEYS) {
    const ax = va[key] || {};
    const opts = (ax.options || [])
      .map((o) => ({
        label: String(o.label || '').trim().slice(0, 80),
        image:
          o.image?.type === 'server' && o.image.url
            ? { url: o.image.url, public_id: o.image.public_id || '' }
            : null
      }))
      .filter((o) => o.label);
    const enabled = Boolean(ax.enabled) && opts.length > 0;
    axes[key] = {
      enabled,
      selectionMode: ax.selectionMode === 'multiple' ? 'multiple' : 'single',
      options: enabled ? opts : []
    };
  }
  return axes;
}

function variantAxesForDraft(va) {
  const out = defaultVariantAxesState();
  for (const { key } of VARIANT_AXIS_KEYS) {
    const ax = va[key] || {};
    out[key] = {
      enabled: Boolean(ax.enabled),
      selectionMode: ax.selectionMode === 'multiple' ? 'multiple' : 'single',
      options: (ax.options || []).map((o) => ({
        label: o.label || '',
        image:
          o.image?.type === 'server' && o.image.url
            ? { type: 'server', url: o.image.url, public_id: o.image.public_id || '' }
            : null
      }))
    };
  }
  return out;
}

function parseDraftVariantAxes(raw) {
  if (!raw || typeof raw !== 'object') return defaultVariantAxesState();
  return normalizeLoadedVariantAxes(raw, '', '', '');
}

/** Plain text from HTML (e.g. search preview) — same idea as the storefront product page. */
function stripHtml(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = String(html);
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim();
}

/** Jodit toolbar: headings, bold styles, font size, lists, table, image, alignment, undo/source. */
function useProductDescriptionEditorConfig() {
  return useMemo(
    () => ({
      theme: 'dark',
      height: 440,
      minHeight: 380,
      toolbarSticky: false,
      toolbarAdaptive: true,
      placeholder:
        'Use the toolbar for headings, bold, font size, bullets, numbers, tables, and images. Content is saved as HTML.',
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      showCharsCounter: true,
      showWordsCounter: true,
      allowResizeY: true,
      uploader: { insertImageAsBase64URI: true },
      style: {
        color: '#111111',
        font: '16px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        lineHeight: 'normal'
      },
      buttons: [
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'fontsize',
        'brush',
        '|',
        'paragraph',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        '|',
        'align',
        '|',
        'table',
        'link',
        'image',
        '|',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        '|',
        'fullsize',
        'source'
      ]
    }),
    []
  );
}

function VariantAxesEditor({ value, onChange }) {
  const setAxis = (key, partial) => {
    onChange({ ...value, [key]: { ...value[key], ...partial } });
  };

  const setAxisEnabled = (key, enabled) => {
    const ax = value[key] || defaultVariantAxesState()[key];
    if (!enabled) {
      for (const o of ax.options || []) {
        if (o.image?.type === 'local' && o.image.url) URL.revokeObjectURL(o.image.url);
      }
      setAxis(key, { enabled: false, selectionMode: ax.selectionMode || 'single', options: [] });
      return;
    }
    setAxis(key, {
      enabled: true,
      options: ax.options?.length ? ax.options : [{ label: '', image: null }],
      selectionMode: ax.selectionMode || 'single'
    });
  };

  const addOption = (key) => {
    const ax = value[key] || defaultVariantAxesState()[key];
    setAxis(key, { options: [...(ax.options || []), { label: '', image: null }] });
  };

  const removeOption = (key, idx) => {
    const ax = value[key];
    const opt = ax.options[idx];
    if (opt?.image?.type === 'local' && opt.image.url) URL.revokeObjectURL(opt.image.url);
    const next = ax.options.filter((_, i) => i !== idx);
    setAxis(key, { options: next });
  };

  const updateOptionLabel = (key, idx, label) => {
    const ax = value[key];
    const options = ax.options.map((o, i) => (i === idx ? { ...o, label } : o));
    setAxis(key, { options });
  };

  const setOptionImageFile = (key, idx, file) => {
    const ax = value[key];
    const options = ax.options.map((o, i) => {
      if (i !== idx) return o;
      if (o.image?.type === 'local' && o.image.url) URL.revokeObjectURL(o.image.url);
      if (!file) return { ...o, image: null };
      return { ...o, image: { type: 'local', id: newLocalKey(), file, url: URL.createObjectURL(file) } };
    });
    setAxis(key, { options });
  };

  const clearOptionImage = (key, idx) => {
    const ax = value[key];
    const options = ax.options.map((o, i) => {
      if (i !== idx) return o;
      if (o.image?.type === 'local' && o.image.url) URL.revokeObjectURL(o.image.url);
      return { ...o, image: null };
    });
    setAxis(key, { options });
  };

  return (
    <div className="product-form__variant-wrap">
      {VARIANT_AXIS_KEYS.map(({ key, label }) => {
        const ax = value[key] || defaultVariantAxesState()[key];
        return (
          <div key={key} className="product-form__variant-axis">
            <label className="product-form__variant-enable">
              <input
                type="checkbox"
                checked={Boolean(ax.enabled)}
                onChange={(e) => setAxisEnabled(key, e.target.checked)}
              />
              <span>Enable {label}</span>
            </label>
            {ax.enabled ? (
              <>
                <div className="product-form__variant-mode" role="radiogroup" aria-label={`${label} selection`}>
                  <span className="product-form__variant-mode-label">Selection</span>
                  <label className="product-form__variant-radio">
                    <input
                      type="radio"
                      name={`${key}-mode`}
                      checked={ax.selectionMode !== 'multiple'}
                      onChange={() => setAxis(key, { selectionMode: 'single' })}
                    />
                    Single
                  </label>
                  <label className="product-form__variant-radio">
                    <input
                      type="radio"
                      name={`${key}-mode`}
                      checked={ax.selectionMode === 'multiple'}
                      onChange={() => setAxis(key, { selectionMode: 'multiple' })}
                    />
                    Multiple
                  </label>
                </div>
                <ul className="product-form__variant-options">
                  {ax.options.map((opt, idx) => (
                    <li
                      key={`${key}-${idx}-${opt.image?.id || opt.image?.public_id || 'x'}`}
                      className="product-form__variant-row"
                    >
                      <input
                        className="product-form__input product-form__variant-label"
                        placeholder={`e.g. ${key === 'color' ? 'Navy' : key === 'shape' ? 'Round' : 'M'}`}
                        value={opt.label}
                        onChange={(e) => updateOptionLabel(key, idx, e.target.value)}
                      />
                      <div className="product-form__variant-img-col">
                        {opt.image?.url ? (
                          <div className="product-form__variant-thumb-wrap">
                            <img
                              className="product-form__variant-thumb"
                              src={opt.image.url}
                              alt=""
                              width={48}
                              height={48}
                            />
                            <button
                              type="button"
                              className="product-form__variant-img-clear"
                              onClick={() => clearOptionImage(key, idx)}
                              title="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : null}
                        <label className="product-form__variant-file">
                          <input
                            type="file"
                            accept="image/*"
                            className="product-form__file-input"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              e.target.value = '';
                              if (!f) return;
                              if (!f.type?.startsWith('image/')) {
                                toast.error('Please choose an image');
                                return;
                              }
                              if (f.size > 5 * 1024 * 1024) {
                                toast.error('Image must be at most 5MB');
                                return;
                              }
                              setOptionImageFile(key, idx, f);
                            }}
                          />
                          <span>{opt.image ? 'Change image' : 'Image (optional)'}</span>
                        </label>
                      </div>
                      <button type="button" className="product-form__variant-remove" onClick={() => removeOption(key, idx)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="product-form__variant-add" onClick={() => addOption(key)}>
                  + Add option
                </button>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * New + edit: `/admin/products/new`, `/admin/products/:id/edit`
 * Images: drag-drop + reorder, existing + new interleaved (see imageBuildOrder on server).
 * Auto-saves form fields to localStorage every 30s (file uploads are not included).
 */
export default function ProductForm() {
  const { id: editId } = useParams();
  const isNew = !editId;
  const navigate = useNavigate();
  const newDraftLoaded = useRef(false);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [imageSlots, setImageSlots] = useState(
    () => /** @type {Array<{ type: 'server'; public_id: string; url: string } | { type: 'local'; id: string; file: File; url: string }>}> */ ([])
  );
  const [tagInput, setTagInput] = useState('');
  const [dragFileActive, setDragFileActive] = useState(false);
  const [dragItemIndex, setDragItemIndex] = useState(/** @type {null | number} */ (null));
  const [variantAxes, setVariantAxes] = useState(() => defaultVariantAxesState());
  const variantAxesRef = useRef(variantAxes);

  const fileInputId = `product-form-files-${useId()}`;
  const draftKey = isNew ? `${LS_PREFIX}new` : `${LS_PREFIX}${editId}`;

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: defaultForm
  });

  const nameW = useWatch({ control, name: 'name' });
  const shortW = useWatch({ control, name: 'shortDescription' });
  const descW = useWatch({ control, name: 'description' });
  const priceW = useWatch({ control, name: 'price' });
  const costW = useWatch({ control, name: 'costPrice' });
  const tagsW = useWatch({ control, name: 'tags' });
  const tagsList = Array.isArray(tagsW) ? tagsW : [];

  useEffect(() => {
    variantAxesRef.current = variantAxes;
  }, [variantAxes]);

  const descriptionEditorConfig = useProductDescriptionEditorConfig();

  const margin =
    costW != null && Number.isFinite(Number(costW)) && Number.isFinite(Number(priceW)) && Number(priceW) > 0
      ? Math.round(((Number(priceW) - Number(costW)) / Number(priceW)) * 10000) / 100
      : null;

  // Categories
  useEffect(() => {
    (async () => {
      try {
        const { data: body } = await adminAPI.categories.list();
        const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        setCategories(list);
      } catch (e) {
        toast.error('Failed to load categories');
      }
    })();
  }, []);

  // Load for edit; new: try draft once
  useEffect(() => {
    if (isNew) {
      if (!newDraftLoaded.current) {
        newDraftLoaded.current = true;
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const p = JSON.parse(raw);
            if (p && typeof p === 'object' && p.form) {
              reset({ ...defaultForm, ...p.form, tags: Array.isArray(p.form.tags) ? p.form.tags : [] });
              if (p.form.variantAxes) setVariantAxes(parseDraftVariantAxes(p.form.variantAxes));
              else setVariantAxes(defaultVariantAxesState());
            }
          }
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const { data: res } = await adminAPI.products.getOneForEdit(editId);
        const p = res.data || res;
        if (!p) {
          toast.error('Product not found');
          navigate('/admin/products');
          return;
        }
        setImageSlots(
          (p.images || []).map((im) => ({
            type: 'server',
            public_id: im.public_id || im.publicId || '',
            url: im.url || ''
          })).filter((i) => i.url || i.public_id)
        );
        const cat = p.category;
        const catId =
          typeof cat === 'object' && cat?._id
            ? String(cat._id)
            : p.categoryId
              ? String(p.categoryId)
              : p.category
                ? String(p.category)
                : '';
        reset({
          name: p.name || '',
          shortDescription: p.shortDescription != null ? String(p.shortDescription) : '',
          description: p.description != null ? String(p.description) : '',
          price: Number(p.price) || 0,
          comparePrice: p.comparePrice == null || p.comparePrice === '' ? null : Number(p.comparePrice),
          costPrice: p.costPrice == null || p.costPrice === '' ? null : Number(p.costPrice),
          sku: p.sku != null ? String(p.sku) : '',
          stock: p.stock != null && Number(p.stock) >= 0 ? Math.floor(Number(p.stock)) : 0,
          lowStockThreshold:
            p.lowStockThreshold == null || p.lowStockThreshold === ''
              ? null
              : Math.max(0, Math.floor(Number(p.lowStockThreshold))),
          category: catId,
          tags: Array.isArray(p.tags) ? p.tags : [],
          isFeatured: Boolean(p.isFeatured),
          isPublished: Boolean(p.isPublished),
          variantGroupKey: p.variantGroupKey != null ? String(p.variantGroupKey) : ''
        });
        setVariantAxes(
          normalizeLoadedVariantAxes(p.variantAxes, p.color, p.texture, p.size)
        );
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Failed to load product');
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, editId, reset, navigate, draftKey]);

  // Autosave every 30s
  const snapshotRef = useRef(() => ({}));
  useEffect(() => {
    const snap = () => {
      const form = getValues();
      return {
        form: {
          ...form,
          tags: Array.isArray(form.tags) ? form.tags : [],
          variantAxes: variantAxesForDraft(variantAxesRef.current)
        },
        at: new Date().toISOString()
      };
    };
    snapshotRef.current = snap;
  }, [getValues]);

  useEffect(() => {
    const t = setInterval(() => {
      try {
        const s = snapshotRef.current();
        localStorage.setItem(draftKey, JSON.stringify(s));
      } catch {
        /* quota */
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [draftKey]);

  // If the tab closes before publish, keep a local draft marked unpublished
  useEffect(() => {
    const persistDraftUnpublished = () => {
      try {
        const form = getValues();
        const s = {
          form: {
            ...form,
            tags: Array.isArray(form.tags) ? form.tags : [],
            isPublished: false,
            variantAxes: variantAxesForDraft(variantAxesRef.current)
          },
          at: new Date().toISOString()
        };
        localStorage.setItem(draftKey, JSON.stringify(s));
      } catch {
        /* quota */
      }
    };
    const onHide = () => persistDraftUnpublished();
    window.addEventListener('pagehide', onHide);
    const onVis = () => {
      if (document.visibilityState === 'hidden') persistDraftUnpublished();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [draftKey, getValues]);

  const onDropNewFiles = useCallback((fileList) => {
    const arr = Array.from(fileList || []);
    for (const file of arr) {
      if (!file.type?.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`);
        continue;
      }
      setImageSlots((prev) => [
        ...prev,
        { type: 'local', id: newLocalKey(), file, url: URL.createObjectURL(file) }
      ]);
    }
  }, []);

  const removeImageAt = (index) => {
    setImageSlots((prev) => {
      const next = [...prev];
      const v = next[index];
      if (v && v.type === 'local' && v.url) URL.revokeObjectURL(v.url);
      next.splice(index, 1);
      return next;
    });
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= imageSlots.length) return;
    setImageSlots((items) => {
      const a = [...items];
      const [c] = a.splice(from, 1);
      a.splice(to, 0, c);
      return a;
    });
  };

  /** New product only: empty all fields, images, and saved browser draft. */
  const handleClearForm = useCallback(() => {
    if (!isNew) return;
    setImageSlots((prev) => {
      for (const v of prev) {
        if (v?.type === 'local' && v.url) URL.revokeObjectURL(v.url);
      }
      return [];
    });
    setTagInput('');
    setVariantAxes(defaultVariantAxesState());
    reset({ ...defaultForm });
    try {
      localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    toast.success('Form cleared — add a new product');
  }, [isNew, reset, draftKey]);

  const showFirstValidationError = (formErrors) => {
    for (const key of Object.keys(formErrors)) {
      const v = formErrors[key];
      if (v?.message) {
        toast.error(String(v.message));
        return;
      }
      if (typeof v === 'object' && v) {
        showFirstValidationError(v);
        return;
      }
    }
    toast.error('Please check the form');
  };

  const onSubmit = async (data, wantPublish) => {
    if (isNew) {
      const nLocal = imageSlots.filter((i) => i.type === 'local');
      if (!nLocal.length) {
        toast.error('Add at least one image to create a product');
        return;
      }
    }

    for (const { key, label } of VARIANT_AXIS_KEYS) {
      const ax = variantAxes[key];
      if (!ax?.enabled) continue;
      const hasLabel = (ax.options || []).some((o) => String(o.label || '').trim());
      if (!hasLabel) {
        toast.error(`Add at least one ${label} value or disable “${label}”.`);
        return;
      }
    }

    const fd = new FormData();
    const normTags = (Array.isArray(data.tags) ? data.tags : [])
      .map((s) => (typeof s === 'string' ? s : String(s)).trim())
      .filter(Boolean);
    const published = wantPublish;

    [
      ['name', data.name],
      ['category', data.category],
      ['price', String(data.price)],
      ['stock', String(data.stock ?? 0)],
      ['description', data.description != null ? String(data.description) : ''],
      ['shortDescription', data.shortDescription != null ? String(data.shortDescription) : ''],
      ['sku', data.sku != null ? String(data.sku) : ''],
      [
        'comparePrice',
        data.comparePrice == null || data.comparePrice === '' ? '' : String(data.comparePrice)
      ],
      ['costPrice', data.costPrice == null || data.costPrice === '' ? '' : String(data.costPrice)],
      [
        'lowStockThreshold',
        data.lowStockThreshold == null || data.lowStockThreshold === ''
          ? ''
          : String(data.lowStockThreshold)
      ],
      ['variantGroupKey', data.variantGroupKey != null ? String(data.variantGroupKey) : ''],
      ['isFeatured', data.isFeatured ? 'true' : 'false'],
      ['isPublished', published ? 'true' : 'false'],
      ['tags', JSON.stringify(normTags)],
      ['variantAxes', JSON.stringify(variantAxesPayloadForApi(variantAxes))]
    ].forEach(([k, v]) => {
      if (k != null) fd.append(k, v);
    });

    for (const { key } of VARIANT_AXIS_KEYS) {
      const opts = variantAxes[key]?.options || [];
      opts.forEach((o, idx) => {
        if (o.image?.type === 'local' && o.image.file) {
          fd.append(`variantOptionImage_${key}_${idx}`, o.image.file, o.image.file.name);
        }
      });
    }

    if (isNew) {
      imageSlots.forEach((s) => {
        if (s.type === 'local' && s.file) fd.append('images', s.file, s.file.name);
      });
    } else {
      const newFiles = [];
      imageSlots.forEach((s) => {
        if (s.type === 'local' && s.file) {
          newFiles.push(s.file);
        }
      });
      newFiles.forEach((f) => fd.append('images', f, f.name));
      if (imageSlots.length) {
        let ni = 0;
        const order = imageSlots.map((s) => {
          if (s.type === 'server' && s.public_id) {
            return `e:${s.public_id}`;
          }
          const t = `n:${ni}`;
          ni += 1;
          return t;
        });
        fd.append('imageBuildOrder', JSON.stringify(order));
      } else {
        fd.append('imageBuildOrder', '[]');
      }
    }

    setSubmitting(true);
    try {
      if (isNew) {
        await adminAPI.products.create(fd);
        try {
          localStorage.removeItem(draftKey);
        } catch {
          /* ignore */
        }
        toast.success('Product created');
        navigate('/admin/products');
        return;
      }
      const { data: res } = await adminAPI.products.update(editId, fd, { asFormData: true });
      const doc = res && res.data;
      if (doc?.variantAxes) {
        setVariantAxes(normalizeLoadedVariantAxes(doc.variantAxes, '', '', ''));
      }
      if (Array.isArray(doc?.images)) {
        setImageSlots(
          doc.images
            .map((im) => ({
              type: 'server',
              public_id: im.public_id,
              url: im.url
            }))
            .filter((i) => i.public_id)
        );
      }
      setValue('isPublished', published);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* ignore */
      }
      toast.success('Product updated');
    } catch (e) {
      const m = e?.response?.data?.message || e?.message || 'Save failed';
      const v = e?.response?.data?.errors;
      if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) {
          if (k === 'images' || v[k]) {
            const msg = typeof v[k] === 'string' ? v[k] : JSON.stringify(v[k]);
            if (k === 'images' || e?.response?.data?.message) toast.error(`${k}: ${msg}`);
          }
        }
      } else {
        toast.error(m);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const seopath = `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${seoSlugFromTitle(nameW || '')}`;
  const seoTitle = (nameW && String(nameW).trim()) || 'Product title';
  const dPlain = stripHtml(descW || '') || '';
  const shortTrim = (shortW && String(shortW).trim()) || '';
  const seoDesc =
    shortTrim ||
    (dPlain ? dPlain.slice(0, 200) : '') ||
    'Add a short description to improve how this appears in search results.';

  if (loading) {
    return (
      <div className="product-form product-form--loading" aria-live="polite">
        <Loader2 className="product-form__spinner" size={32} />
        <p>Loading product…</p>
      </div>
    );
  }

  return (
    <>
      <div className="product-form__scroll-wrap">
        <form className="product-form" onSubmit={(e) => e.preventDefault()}>
          <div className="product-form__header">
            <Link to="/admin/products" className="product-form__back">
              ← Back to products
            </Link>
            <h1 className="product-form__title">{isNew ? 'Add product' : 'Edit product'}</h1>
            <p className="product-form__hint">
              Text fields auto-save every 30s (not images). Closing the tab keeps an unpublished draft locally.
            </p>
          </div>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Basic info</h2>
            <label className="product-form__label">
              Product title
              <input
                className="product-form__input"
                {...register('name')}
                type="text"
                autoComplete="off"
              />
              {errors.name && <span className="product-form__err">{errors.name.message}</span>}
            </label>
            <div className="product-form__label">
              Store URL (from product title)
              <span className="product-form__field-hint">
                The public link is always built from the title, e.g.{' '}
                <code>{`/shop/${seoSlugFromTitle(nameW || '')}`}</code>. If that path is already taken, the server may
                append <code>-2</code>, <code>-3</code>, etc.
              </span>
            </div>
            <label className="product-form__label">
              Short description
              <input
                className="product-form__input"
                {...register('shortDescription')}
                type="text"
                placeholder="For listings, SEO, and product cards"
              />
              {errors.shortDescription && (
                <span className="product-form__err">{errors.shortDescription.message}</span>
              )}
            </label>
            <label className="product-form__label product-form__label--block">
              Full description
              <span className="product-form__field-hint">
                The product page shows your HTML as saved—sizes, colours, spacing, lists, and tables match what you set
                in the editor (plain text defaults to black). Very large pages may take longer to save.
              </span>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="product-form__rich-editor">
                    <JoditEditor
                      value={field.value ?? ''}
                      config={descriptionEditorConfig}
                      tabIndex={0}
                      onBlur={field.onBlur}
                      onChange={(html) => field.onChange(html)}
                    />
                  </div>
                )}
              />
              {errors.description && <span className="product-form__err">{errors.description.message}</span>}
            </label>
            <label className="product-form__label">
              Category
              <select className="product-form__input" {...register('category')}>
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name || c.slug}
                  </option>
                ))}
              </select>
              {errors.category && <span className="product-form__err">{errors.category.message}</span>}
            </label>
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Variants</h2>
            <p className="product-form__hint">
              Turn on Color, Shape/material, and/or Size. Each can be <strong>single</strong> or <strong>multiple</strong>{' '}
              choice. Add one row per value; optional image per row (e.g. colour swatch). Shoppers see these on the
              product page.
            </p>
            <VariantAxesEditor value={variantAxes} onChange={setVariantAxes} />
            <label className="product-form__label">
              Group key (same category)
              <span className="product-form__field-hint">
                Use the same value on related products to group variants (any short label you choose).
              </span>
              <input
                className="product-form__input"
                type="text"
                {...register('variantGroupKey')}
                placeholder="e.g. spring-hoodie-line"
              />
              {errors.variantGroupKey && (
                <span className="product-form__err">{errors.variantGroupKey.message}</span>
              )}
            </label>
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Images</h2>
            <p className="product-form__hint">Drag files here or use the file picker. Reorder with drag. New products require at least one image.</p>
            <div
              className={`product-form__dropzone${dragFileActive ? ' is-active' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragFileActive(true);
              }}
              onDragLeave={() => setDragFileActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragFileActive(false);
                onDropNewFiles(e.dataTransfer?.files);
              }}
            >
              <input
                type="file"
                id={fileInputId}
                className="product-form__file-input"
                accept="image/*"
                multiple
                onChange={(e) => onDropNewFiles(e.target.files)}
              />
              <label htmlFor={fileInputId} className="product-form__dropzone-label">
                <span>Drop images here, or</span> <em>browse</em>
              </label>
            </div>
            {imageSlots.length > 0 && (
              <ul className="product-form__thumbs" aria-label="Image order (drag to reorder)">
                {imageSlots.map((s, i) => (
                  <li
                    key={s.type === 'server' ? s.public_id : s.id}
                    className="product-form__thumb"
                    draggable
                    onDragStart={() => setDragItemIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragItemIndex == null) return;
                      if (dragItemIndex !== i) moveItem(dragItemIndex, i);
                      setDragItemIndex(null);
                    }}
                  >
                    <span className="product-form__thumb-grip" aria-hidden>
                      <GripVertical size={16} />
                    </span>
                    <img
                      className="product-form__thumb-img"
                      src={s.url}
                      alt=""
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                    />
                    <button
                      type="button"
                      className="product-form__thumb-remove"
                      onClick={() => removeImageAt(i)}
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Pricing</h2>
            <div className="product-form__grid-3">
              <label className="product-form__label">
                Selling price (PKR)
                <input className="product-form__input" type="number" min={0} step="0.01" {...register('price')} />
                {errors.price && <span className="product-form__err">{errors.price.message}</span>}
              </label>
              <label className="product-form__label">
                Actual / list price (PKR)
                <span className="product-form__field-hint">Optional — shown as “was” price when lower than selling price.</span>
                <input className="product-form__input" type="number" min={0} step="0.01" {...register('comparePrice')} />
                {errors.comparePrice && <span className="product-form__err">{errors.comparePrice.message}</span>}
              </label>
              <label className="product-form__label">
                Cost (PKR)
                <span className="product-form__field-hint">Optional — for your margin notes only.</span>
                <input className="product-form__input" type="number" min={0} step="0.01" {...register('costPrice')} />
                {errors.costPrice && <span className="product-form__err">{errors.costPrice.message}</span>}
                {margin != null && <span className="product-form__note">Margin on selling price: {margin}%</span>}
              </label>
            </div>
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Inventory</h2>
            <div className="product-form__grid-3">
              <label className="product-form__label">
                SKU
                <input className="product-form__input" type="text" {...register('sku')} placeholder="Stock keeping unit" />
                {errors.sku && <span className="product-form__err">{errors.sku.message}</span>}
              </label>
              <label className="product-form__label">
                Stock in hand
                <input className="product-form__input" type="number" min={0} step={1} {...register('stock')} />
                {errors.stock && <span className="product-form__err">{errors.stock.message}</span>}
              </label>
              <label className="product-form__label">
                Low stock alert
                <input
                  className="product-form__input"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Optional"
                  {...register('lowStockThreshold')}
                />
                {errors.lowStockThreshold && (
                  <span className="product-form__err">{errors.lowStockThreshold.message}</span>
                )}
              </label>
            </div>
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Tags &amp; visibility</h2>
            <div className="product-form__tags">
              <label className="product-form__label">Tags (press Enter)</label>
              <div className="product-form__tag-bubbles">
                {tagsList.map((tag, i) => (
                  <span key={`${i}-${String(tag)}`} className="product-form__tag">
                    {tag}
                    <button
                      type="button"
                      className="product-form__tag-x"
                      onClick={() => {
                        const n = tagsList.filter((_, j) => j !== i);
                        setValue('tags', n, { shouldValidate: true, shouldDirty: true });
                      }}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                className="product-form__input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const t = tagInput.trim();
                    if (t) {
                      const cur = new Set(
                        (Array.isArray(getValues('tags')) ? getValues('tags') : []).map((s) =>
                          String(s).toLowerCase()
                        )
                      );
                      if (cur.size >= 20) {
                        toast.error('At most 20 tags');
                        return;
                      }
                      if (cur.has(t.toLowerCase())) {
                        setTagInput('');
                        return;
                      }
                      setValue('tags', [...tagsList, t], { shouldValidate: true, shouldDirty: true });
                    }
                    setTagInput('');
                  }
                }}
                placeholder="e.g. summer, cotton"
              />
            </div>
            <fieldset className="product-form__fieldset">
              <legend className="product-form__legend">Storefront status</legend>
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <div className="product-form__radio-row" role="radiogroup" aria-label="Publication status">
                    <label className="product-form__radio">
                      <input
                        type="radio"
                        name="storefront-published"
                        checked={!field.value}
                        onChange={() => field.onChange(false)}
                      />
                      Draft (hidden from shop)
                    </label>
                    <label className="product-form__radio">
                      <input
                        type="radio"
                        name="storefront-published"
                        checked={field.value}
                        onChange={() => field.onChange(true)}
                      />
                      Active (published)
                    </label>
                  </div>
                )}
              />
            </fieldset>
            <label className="product-form__toggle product-form__toggle--block">
              <input type="checkbox" {...register('isFeatured')} />
              Featured on homepage
            </label>
          </section>

          <section className="product-form__section">
            <h2 className="product-form__section-title">Search (preview)</h2>
            <div className="product-form__seo" aria-label="How this product may look in search results">
              <div className="product-form__seo-title">{seoTitle}</div>
              <div className="product-form__seo-url">{seopath}</div>
              <div className="product-form__seo-desc">{seoDesc}</div>
            </div>
          </section>
        </form>
      </div>
      <div className="product-form__sticky" role="group" aria-label="Form actions">
        {isNew && (
          <button
            type="button"
            className="product-form__action-btn product-form__action-btn--ghost"
            disabled={!!submitting || isSubmitting}
            onClick={handleClearForm}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="product-form__action-btn"
          disabled={!!submitting || isSubmitting}
          onClick={handleSubmit(
            (d) => onSubmit({ ...d, isPublished: false }, false),
            showFirstValidationError
          )}
        >
          {submitting ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className="product-form__action-btn product-form__action-btn--primary"
          disabled={!!submitting || isSubmitting}
          onClick={handleSubmit(
            (d) => onSubmit({ ...d, isPublished: true }, true),
            showFirstValidationError
          )}
        >
          {submitting ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </>
  );
}
