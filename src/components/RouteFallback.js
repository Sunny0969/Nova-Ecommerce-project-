import React from 'react';

export default function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <div className="route-fallback__spinner" aria-hidden="true" />
      <p className="route-fallback__text">Loading…</p>
    </div>
  );
}
