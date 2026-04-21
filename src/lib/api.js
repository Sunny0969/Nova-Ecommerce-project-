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

export function apiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}
