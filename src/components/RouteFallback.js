import React from 'react';
import PageSuspenseFallback from './skeletons/PageSuspenseFallback';

/** @deprecated Use PageSuspenseFallback — kept for admin/staff imports */
export default function RouteFallback() {
  return <PageSuspenseFallback />;
}

export { PageSuspenseFallback };
