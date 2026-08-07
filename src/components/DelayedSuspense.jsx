import React, { Suspense, useEffect, useState } from 'react';

/**
 * Shows the fallback only after `delayMs` so fast/cached chunk loads never flash a loader.
 */
export function DelayedFallback({ fallback, delayMs = 180 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (delayMs <= 0) {
      setVisible(true);
      return undefined;
    }
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  if (!visible) {
    return <div className="route-suspense-quiet" aria-hidden />;
  }

  return fallback;
}

export default function DelayedSuspense({ children, fallback, delayMs = 180 }) {
  return (
    <Suspense fallback={<DelayedFallback fallback={fallback} delayMs={delayMs} />}>
      {children}
    </Suspense>
  );
}
