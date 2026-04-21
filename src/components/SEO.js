import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  getCanonicalUrl,
  formatPageTitle,
  getDefaultOgImageUrl,
  defaultDescription,
  siteName,
  defaultOgLocale,
  defaultTitle
} from '../utils/seo';

/**
 * Per-route meta + Open Graph + Twitter; always outputs canonical and robots.
 *
 * @param {object} props
 * @param {string} [props.title] — short segment; full title = `formatPageTitle(title)` (e.g. "Contact" → "Contact | Nova Shop")
 * @param {string} [props.description] — meta description; falls back to default from utils/seo
 * @param {string} [props.canonicalUrl] — absolute https URL, or path starting with `/` (no query). Omits = current path only (strips search params for duplicate-URL control)
 * @param {string} [props.ogImage] — absolute image URL; default site OG image
 * @param {string} [props.ogType] — e.g. `website` | `product`
 * @param {boolean} [props.noIndex] — `noindex, nofollow` for account, admin, auth, cart, etc.
 * @param {object|Array<object>} [props.schema] — one or more JSON-LD objects (array = multiple <script> tags)
 * @param {Array<{ href: string, as?: string, type?: string, crossOrigin?: string, imageSrcSet?: string, imageSizes?: string }>} [props.preload] — `<link rel="preload">` hints (e.g. LCP hero)
 */
export default function SEO({ title, description, canonicalUrl, ogImage, ogType, noIndex, schema, preload }) {
  const { pathname } = useLocation();

  const absoluteCanonical = useMemo(() => {
    if (canonicalUrl != null && String(canonicalUrl).trim() !== '') {
      const c = String(canonicalUrl).trim();
      if (c.startsWith('http://') || c.startsWith('https://')) return c;
      const path = c.startsWith('/') ? c : `/${c}`;
      return getCanonicalUrl(path);
    }
    return getCanonicalUrl(pathname);
  }, [canonicalUrl, pathname]);

  const fullTitle = useMemo(() => {
    if (title == null || String(title).trim() === '') return defaultTitle;
    return formatPageTitle(String(title).trim());
  }, [title]);

  const desc =
    description != null && String(description).trim() !== ''
      ? String(description).trim()
      : defaultDescription;
  const img = ogImage != null && String(ogImage).trim() !== '' ? String(ogImage).trim() : getDefaultOgImageUrl();
  const type = ogType != null && String(ogType).trim() !== '' ? String(ogType).trim() : 'website';
  const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1';

  const jsonLd = useMemo(() => {
    if (schema == null) return null;
    if (Array.isArray(schema)) {
      return schema.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ));
    }
    return <script type="application/ld+json">{JSON.stringify(schema)}</script>;
  }, [schema]);

  const preloadLinks = useMemo(() => {
    if (!Array.isArray(preload) || !preload.length) return null;
    return preload.map((p, i) => {
      if (!p || !p.href) return null;
      const as = p.as || 'image';
      return (
        <link
          key={`preload-${i}`}
          rel="preload"
          href={p.href}
          as={as}
          {...(p.type ? { type: p.type } : {})}
          {...(p.crossOrigin ? { crossOrigin: p.crossOrigin } : {})}
          {...(p.imageSrcSet ? { imageSrcSet: p.imageSrcSet } : {})}
          {...(p.imageSizes ? { imageSizes: p.imageSizes } : {})}
        />
      );
    });
  }, [preload]);

  return (
    <Helmet htmlAttributes={{ lang: 'en' }}>
      {preloadLinks}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={absoluteCanonical} />
      <meta name="robots" content={robots} />
      <meta name="theme-color" content="#0f0f1a" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={defaultOgLocale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={absoluteCanonical} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd}
    </Helmet>
  );
}
