import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '../utils/seo';
import { buildOrganizationSchema, buildWebSiteSchema } from '../utils/jsonLd';

const GSC_VERIFICATION = process.env.REACT_APP_GSC_VERIFICATION;

/**
 * Site-wide Organization + WebSite JSON-LD (injected once in the app shell).
 */
export default function GlobalJsonLd() {
  const scripts = useMemo(() => {
    const base = getSiteUrl() || undefined;
    const schemas = [buildOrganizationSchema(base), buildWebSiteSchema(base)];
    return schemas.map((s, i) => (
      <script key={`global-ld-${i}`} type="application/ld+json">
        {JSON.stringify(s)}
      </script>
    ));
  }, []);

  return (
    <Helmet>
      {GSC_VERIFICATION ? (
        <meta name="google-site-verification" content={GSC_VERIFICATION} />
      ) : null}
      {scripts}
    </Helmet>
  );
}
