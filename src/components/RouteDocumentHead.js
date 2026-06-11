import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getRouteSeo } from '../config/routeSeo';
import { getCanonicalUrl } from '../utils/seo';

/**
 * Sets document title + core meta as soon as the route is known — before lazy page chunks load.
 * Prevents flash from index.html defaults to page-specific SEO.
 */
export default function RouteDocumentHead() {
  const { pathname } = useLocation();

  const meta = useMemo(() => getRouteSeo(pathname), [pathname]);
  const canonical = useMemo(() => getCanonicalUrl(pathname), [pathname]);

  if (!meta) return null;

  return (
    <Helmet prioritizeSeoTags>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords ? <meta name="keywords" content={meta.keywords} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
