import React from 'react';
import BrandLogoLoader from '../BrandLogoLoader';

/** Route chunk loading — logo in main content; header & mobile nav stay visible. */
export default function PageSuspenseFallback({ label = 'Loading page' }) {
  return <BrandLogoLoader label={label} />;
}
