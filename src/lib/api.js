/** Normalize GET /api/products paginated response */
export function unwrapProductListResponse(res) {
  const d = res?.data?.data;
  if (!d) {
    return { products: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
  if (Array.isArray(d)) {
    return {
      products: d,
      totalCount: d.length,
      totalPages: 1,
      currentPage: 1
    };
  }
  return {
    products: d.products || [],
    totalCount: d.totalCount ?? 0,
    totalPages: d.totalPages ?? 0,
    currentPage: d.currentPage ?? 1
  };
}

/** GET /api/products/featured — data is array */
export function unwrapFeaturedResponse(res) {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : [];
}

/** GET /api/categories — data is array of category docs */
export function sortCategoriesAlphabetically(categories) {
  if (!Array.isArray(categories) || categories.length < 2) {
    return Array.isArray(categories) ? [...categories] : [];
  }

  return [...categories].sort((a, b) =>
    String(a.name || a.slug || '').localeCompare(String(b.name || b.slug || ''), 'en', {
      sensitivity: 'base',
      numeric: true
    })
  );
}

/** Storefront categories — active with at least one published product. */
export function filterStorefrontCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.filter((cat) => {
    if (!cat || cat.isActive === false) return false;
    const count = Number(cat.productCount);
    if (Number.isFinite(count)) return count > 0;
    return true;
  });
}

/** GET /api/categories — data is array of category docs (storefront order: A–Z) */
export function unwrapCategoriesResponse(res) {
  const d = res?.data?.data;
  return sortCategoriesAlphabetically(filterStorefrontCategories(Array.isArray(d) ? d : []));
}

/** Admin pickers — all categories (including new/empty and inactive). */
export function unwrapAdminCategoriesResponse(res) {
  const d = res?.data?.data;
  return sortCategoriesAlphabetically(Array.isArray(d) ? d : []);
}

/** Load full category list for admin forms (product, coupon, filters). */
export async function fetchAdminCategories(adminAPI) {
  try {
    const res = await adminAPI.categories.listAll();
    return unwrapAdminCategoriesResponse(res);
  } catch (e) {
    if (e?.response?.status === 404) {
      const res = await adminAPI.categories.list();
      return unwrapAdminCategoriesResponse(res);
    }
    throw e;
  }
}

function stringifyApiDetail(value) {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => stringifyApiDetail(v)).filter(Boolean).join(' ') || null;
  }
  if (typeof value === 'object' && (value.message != null || value.error != null)) {
    return stringifyApiDetail(value.message != null ? value.message : value.error);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

/** User-facing string from an Axios / API error (avoids non-string values that break React as children). */
export function apiMessage(error, fallback) {
  const raw = error?.response?.data;
  if (raw && typeof raw === 'string') {
    return raw;
  }
  const msg = stringifyApiDetail(raw?.message ?? raw?.error);
  return msg && msg.trim() !== '' ? msg : fallback;
}
