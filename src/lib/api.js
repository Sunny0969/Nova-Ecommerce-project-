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
export function unwrapCategoriesResponse(res) {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : [];
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
