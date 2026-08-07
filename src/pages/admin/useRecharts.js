import { useEffect, useState } from 'react';

/** Loads recharts only when an admin analytics screen mounts. */
export function useRecharts() {
  const [recharts, setRecharts] = useState(null);

  useEffect(() => {
    let active = true;
    import(
      /* webpackChunkName: "admin-recharts" */
      'recharts'
    ).then((mod) => {
      if (active) setRecharts(mod);
    });
    return () => {
      active = false;
    };
  }, []);

  return recharts;
}
