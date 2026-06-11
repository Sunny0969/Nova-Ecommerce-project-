import React, { useEffect, useRef, useState } from 'react';

/**
 * Mount children only when the section nears the viewport — cuts initial JS work (INP/LCP).
 */
export default function LazySection({
  children,
  className,
  minHeight = '12rem',
  rootMargin = '240px 0px'
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={!visible ? { minHeight } : undefined}
      aria-busy={!visible}
    >
      {visible ? children : null}
    </div>
  );
}
