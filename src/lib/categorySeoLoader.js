let seoModulePromise;

function loadCategorySeoModule() {
  if (!seoModulePromise) {
    seoModulePromise = import(
      /* webpackChunkName: "category-seo-data" */
      '../data/categorySeoContent'
    );
  }
  return seoModulePromise;
}

/**
 * Fetch category SEO copy on demand (102 KB static blob — not on /shop initial chunk).
 * @param {string | null | undefined} slug
 * @returns {Promise<object | null>}
 */
export async function getCategorySeoContentAsync(slug) {
  if (!slug) return null;
  const mod = await loadCategorySeoModule();
  return mod.getCategorySeoContent(String(slug).toLowerCase());
}
